package com.ivanta.replacement;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.InvalidStateException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.delivery.DeliveryAddress;
import com.ivanta.delivery.DeliveryAddressRepository;
import com.ivanta.delivery.ShipmentRepository;
import com.ivanta.dto.ReplacementDtos.*;
import com.ivanta.inventory.InventoryService;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderItem;
import com.ivanta.order.OrderItemRepository;
import com.ivanta.order.OrderRepository;
import com.ivanta.order.OrderStateMachine;
import com.ivanta.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Replacements (§21): customer requests a replacement for a delivered item within
 * the (per-product configurable) window; on admin approval stock availability is
 * re-checked under the inventory locks and a zero-total replacement ORDER is
 * generated from the immutable order-item snapshot. The replacement order walks
 * the normal fulfilment pipeline (PROCESSING → PACKED → ship → tracking events),
 * and DeliveryService hooks keep this entity and the ORIGINAL order's
 * REPLACEMENT_* status in sync. Everything is audited.
 */
@Service
@RequiredArgsConstructor
public class ReplacementService {

    private static final Set<String> OPEN_STATUSES = Set.of("REQUESTED", "APPROVED", "PROCESSING", "SHIPPED");

    private final ReplacementRepository replacements;
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final DeliveryAddressRepository deliveryAddresses;
    private final ShipmentRepository shipments;
    private final ProductRepository products;
    private final InventoryService inventory;
    private final OrderStateMachine stateMachine;
    private final NotificationService notifications;
    private final IvantaProperties props;
    private final IdService ids;
    private final AuditService audit;

    /* ---------- customer ---------- */

    @Transactional
    public ReplacementView request(String userId, ReplacementCreateRequest req) {
        Order order = orders.findByIdAndUserId(req.orderId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + req.orderId()));
        if (!"DELIVERED".equals(order.getStatus()))
            throw new BusinessException(ErrorCode.RETURN_NOT_ALLOWED,
                    "Only delivered orders can request a replacement (current status: " + order.getStatus() + ")");

        OrderItem item = orderItems.findById(req.orderItemId())
                .filter(oi -> oi.getOrderId().equals(order.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Order item " + req.orderItemId()));

        Instant deliveredAt = order.getDeliveredAt() != null ? order.getDeliveredAt()
                : shipments.findFirstByOrderIdOrderByIdDesc(order.getId())
                        .map(s -> s.getDeliveredAt() == null ? order.getPlacedAt() : s.getDeliveredAt())
                        .orElse(order.getPlacedAt());
        int windowDays = windowDaysFor(order);
        if (Instant.now().isAfter(deliveredAt.plus(windowDays, ChronoUnit.DAYS)))
            throw new BusinessException(ErrorCode.RETURN_NOT_ALLOWED,
                    "The " + windowDays + "-day replacement window for this order has closed");

        boolean hasOpen = replacements.findByOrderId(order.getId()).stream()
                .anyMatch(r -> OPEN_STATUSES.contains(r.getStatus()));
        if (hasOpen)
            throw new BusinessException(ErrorCode.CONFLICT, "A replacement is already open for this order");

        Replacement r = new Replacement();
        r.setId(ids.next("replacements", "REP", 6));
        r.setOrderId(order.getId());
        r.setOrderItemId(item.getId());
        r.setUserId(userId);
        r.setReason(req.reason().trim());
        r.setRequestedAt(Instant.now());
        replacements.save(r);

        stateMachine.apply(order, "REPLACEMENT_REQUESTED", "CUSTOMER", userId, req.reason());
        audit.record("REPLACEMENT_REQUESTED", "replacement", r.getId(), null,
                "order=" + order.getId() + " item=" + item.getProductName());
        notifications.notifyUser(userId, "REPLACEMENT_REQUESTED",
                Map.of("replacementNumber", r.getId(), "orderNumber", displayNumber(order)),
                "replacement", r.getId());
        return toView(r);
    }

    @Transactional(readOnly = true)
    public List<ReplacementView> listForUser(String userId) {
        return replacements.findByUserIdOrderByIdDesc(userId).stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public ReplacementView getForUser(String userId, String replacementId) {
        Replacement r = replacements.findById(replacementId)
                .filter(x -> x.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Replacement " + replacementId));
        return toView(r);
    }

    /* ---------- admin ---------- */

    @Transactional
    public ReplacementView updateStatus(String replacementId, ReplacementStatusUpdate req, String adminId) {
        Replacement r = replacements.findById(replacementId)
                .orElseThrow(() -> new ResourceNotFoundException("Replacement " + replacementId));
        String from = r.getStatus();
        String to = req.status();
        if (!transitionAllowed(from, to))
            throw new BusinessException(ErrorCode.INVALID_STATE,
                    "Cannot move replacement from " + from + " to " + to);

        Order order = orders.findById(r.getOrderId()).orElseThrow();
        OrderItem item = orderItems.findById(r.getOrderItemId()).orElseThrow();
        String dn = displayNumber(order);

        switch (to) {
            case "APPROVED" -> {
                // stock check + commit under the inventory locks (no overselling)
                if (item.getVariantId() != null) {
                    long available = inventory.totalAvailable(item.getVariantId());
                    if (available < item.getQuantity())
                        throw new BusinessException(ErrorCode.OUT_OF_STOCK,
                                "Replacement stock unavailable (" + available + " of "
                                        + item.getQuantity() + " required)");
                }
                Order ro = createReplacementOrder(order, item, adminId);
                r.setStatus("APPROVED");
                r.setReplacementOrderId(ro.getId());
                r.setApprovedBy(adminId);
                replacements.save(r);
                stateMachine.apply(order, "REPLACEMENT_PROCESSING", "ADMIN", adminId,
                        "Replacement approved — replacement order " + displayNumber(ro) + " generated");
                audit.record("REPLACEMENT_APPROVED", "replacement", r.getId(), from,
                        "replacementOrder=" + ro.getId());
                notifications.notifyUser(order.getUserId(), "REPLACEMENT_APPROVED",
                        Map.of("orderNumber", dn, "replacementOrderNumber", displayNumber(ro)),
                        "replacement", r.getId());
                // immediately move the replacement order into fulfilment
                r.setStatus("PROCESSING");
                replacements.save(r);
            }
            case "REJECTED" -> {
                r.setStatus("REJECTED");
                r.setResolvedAt(Instant.now());
                replacements.save(r);
                stateMachine.apply(order, "DELIVERED", "ADMIN", adminId,
                        "Replacement " + r.getId() + " rejected"
                                + (req.reason() == null ? "" : ": " + req.reason()));
                audit.record("REPLACEMENT_REJECTED", "replacement", r.getId(), from, req.reason());
                notifications.notifyUser(order.getUserId(), "REPLACEMENT_REJECTED",
                        Map.of("replacementNumber", r.getId(), "orderNumber", dn,
                                "reason", req.reason() == null ? "" : req.reason()),
                        "replacement", r.getId());
            }
            case "CLOSED" -> {
                r.setStatus("CLOSED");
                r.setResolvedAt(Instant.now());
                replacements.save(r);
                audit.record("REPLACEMENT_CLOSED", "replacement", r.getId(), from, null);
            }
            default -> throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unknown status " + to);
        }
        return toView(r);
    }

    @Transactional(readOnly = true)
    public List<ReplacementView> adminList(String status, int limit) {
        var page = PageRequest.of(0, Math.min(Math.max(1, limit), 200));
        return (status == null || status.isBlank()
                ? replacements.findAllByOrderByIdDesc(page)
                : replacements.findByStatusOrderByIdDesc(status, page))
                .stream().map(this::toView).toList();
    }

    /* ---------- replacement order generation ---------- */

    @Transactional
    protected Order createReplacementOrder(Order original, OrderItem item, String adminId) {
        Order ro = new Order();
        ro.setId(ids.next("orders", "ORD-" + Year.now().getValue(), 6));
        ro.setOrderNumber(ids.next("orders",
                "IVN-" + DateTimeFormatter.BASIC_ISO_DATE.format(LocalDate.now()), 6));
        ro.setUserId(original.getUserId());
        ro.setStatus("PLACED");
        ro.setSubtotal(nz(item.getFinalPrice()));
        ro.setDiscountTotal(nz(item.getFinalPrice()));   // 100% replacement credit
        ro.setCouponDiscount(BigDecimal.ZERO);
        ro.setTaxTotal(BigDecimal.ZERO);
        ro.setShippingFee(BigDecimal.ZERO);
        ro.setGrandTotal(BigDecimal.ZERO);              // customer pays nothing
        ro.setCurrency(original.getCurrency());
        ro.setPaymentStatus("SUCCESS");                 // zero due — nothing to collect
        ro.setShippingStatus("PENDING");
        ro.setShippingMethodId(original.getShippingMethodId());
        ro.setContactEmail(original.getContactEmail());
        ro.setContactPhone(original.getContactPhone());
        ro.setCustomerNote("Replacement for order " + displayNumber(original));
        ro.setPlacedAt(Instant.now());
        ro.setExpectedDelivery(original.getExpectedDelivery() == null
                ? LocalDate.now().plusDays(5) : LocalDate.now().plusDays(5));
        orders.save(ro);

        OrderItem ri = new OrderItem();
        ri.setId(ids.next("order_items", "OIT", 6));
        ri.setOrderId(ro.getId());
        ri.setProductId(item.getProductId());
        ri.setVariantId(item.getVariantId());
        ri.setProductName(item.getProductName());
        ri.setVariantName(item.getVariantName());
        ri.setColor(item.getColor());
        ri.setStorage(item.getStorage());
        ri.setSku(item.getSku());
        ri.setImageKey(item.getImageKey());
        ri.setQuantity(item.getQuantity());
        ri.setUnitPrice(item.getUnitPrice());
        ri.setDiscount(nz(item.getFinalPrice()));       // fully credited
        ri.setTaxRate(BigDecimal.ZERO);
        ri.setTaxAmount(BigDecimal.ZERO);
        ri.setFinalPrice(BigDecimal.ZERO);
        orderItems.save(ri);

        // copy the immutable address snapshot
        deliveryAddresses.findByOrderId(original.getId()).ifPresent(a -> {
            DeliveryAddress da = new DeliveryAddress();
            da.setId(ids.next("delivery_addresses", "DAD", 5));
            da.setOrderId(ro.getId());
            da.setName(a.getName());
            da.setPhone(a.getPhone());
            da.setAddressLine1(a.getAddressLine1());
            da.setAddressLine2(a.getAddressLine2());
            da.setLocality(a.getLocality());
            da.setRoad(a.getRoad());
            da.setCity(a.getCity());
            da.setDistrict(a.getDistrict());
            da.setState(a.getState());
            da.setPincode(a.getPincode());
            da.setCountry(a.getCountry());
            da.setLandmark(a.getLandmark());
            da.setAddressType(a.getAddressType());
            da.setLatitude(a.getLatitude());
            da.setLongitude(a.getLongitude());
            deliveryAddresses.save(da);
            ro.setShippingAddressId(da.getId());
            orders.save(ro);
        });

        // reserve then immediately commit the replacement stock (locks prevent oversell)
        inventory.reserveForOrder(ro.getId(),
                List.of(new InventoryService.ReserveLine(item.getProductId(), item.getVariantId(),
                        item.getQuantity(), item.getProductName())),
                props.getCheckout().getReservationTtlMinutes());
        inventory.consumeForOrder(ro.getId());

        stateMachine.recordInitial(ro, "ADMIN", adminId);
        stateMachine.apply(ro, "CONFIRMED", "SYSTEM", null, "Replacement order auto-confirmed");
        stateMachine.apply(ro, "PROCESSING", "SYSTEM", null, "Replacement fulfilment started");
        audit.record("ORDER_CREATED", "order", ro.getId(), null,
                "replacement order for " + original.getId() + " item=" + item.getId());
        return ro;
    }

    /* ---------- helpers ---------- */

    private static boolean transitionAllowed(String from, String to) {
        return switch (from) {
            case "REQUESTED" -> Set.of("APPROVED", "REJECTED").contains(to);
            case "APPROVED", "PROCESSING" -> Set.of("CLOSED").contains(to);
            case "SHIPPED" -> Set.of("CLOSED").contains(to);
            case "DELIVERED", "REJECTED", "CLOSED" -> false;
            default -> false;
        };
    }

    private int windowDaysFor(Order order) {
        Integer override = orderItems.findByOrderId(order.getId()).stream()
                .map(oi -> products.findById(oi.getProductId())
                        .map(p -> p.getReturnWindowDays()).orElse(null))
                .filter(Objects::nonNull)
                .findFirst().orElse(null);
        return override != null ? override : props.getReturns().getWindowDays();
    }

    private static String displayNumber(Order o) {
        return o.getOrderNumber() != null ? o.getOrderNumber() : o.getId();
    }

    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    public ReplacementView toView(Replacement r) {
        Order order = orders.findById(r.getOrderId()).orElse(null);
        OrderItem item = orderItems.findById(r.getOrderItemId()).orElse(null);
        String replOrderNumber = r.getReplacementOrderId() == null ? null
                : orders.findById(r.getReplacementOrderId()).map(ReplacementService::displayNumber).orElse(null);
        return new ReplacementView(r.getId(), r.getOrderId(),
                order == null ? null : displayNumber(order),
                r.getOrderItemId(),
                item == null ? null : item.getProductName(),
                item == null ? null : item.getVariantName(),
                item == null ? null : item.getSku(),
                item == null ? null : item.getImageKey(),
                item == null ? 0 : item.getQuantity(),
                item == null ? BigDecimal.ZERO : nz(item.getFinalPrice()),
                r.getStatus(), r.getReason(), r.getReplacementOrderId(), replOrderNumber,
                r.getRequestedAt() == null ? null : r.getRequestedAt().toString(),
                r.getResolvedAt() == null ? null : r.getResolvedAt().toString());
    }
}
