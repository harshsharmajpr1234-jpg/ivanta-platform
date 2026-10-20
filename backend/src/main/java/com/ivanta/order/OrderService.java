package com.ivanta.order;

import com.ivanta.audit.AuditService;
import com.ivanta.auth.UserRepository;
import com.ivanta.cart.CartService;
import com.ivanta.checkout.CheckoutService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.InvalidStateException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.coupon.CouponService;
import com.ivanta.delivery.*;
import com.ivanta.dto.OrderDtos.*;
import com.ivanta.dto.ProductDtos;
import com.ivanta.dto.UserDtos.AddressView;
import com.ivanta.inventory.InventoryService;
import com.ivanta.invoice.InvoiceRepository;
import com.ivanta.notification.NotificationService;
import com.ivanta.payment.Payment;
import com.ivanta.payment.PaymentRepository;
import com.ivanta.product.ProductRepository;
import com.ivanta.product.ProductVariantRepository;
import com.ivanta.replacement.ReplacementRepository;
import com.ivanta.returnrefund.Refund;
import com.ivanta.returnrefund.RefundService;
import com.ivanta.returnrefund.ReturnRequestRepository;
import com.ivanta.user.Address;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Year;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Order lifecycle (§22/§23/§46): placement inside a single transaction with stock
 * reservation, snapshot line items (name/sku/color/storage/prices), server-computed
 * totals and human-friendly order numbers (IVN-YYYYMMDD-NNNNNN); customer and admin
 * search; cancellation (direct pre-ship, request post-ship) with stock release/restock
 * and refunds; admin transitions with side-effect guards; real timeline built from the
 * append-only status ledger, payment history and shipment tracking events.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Set<String> RETURN_OPEN_STATUSES = Set.of(
            "REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "RECEIVED", "INSPECTION",
            "APPROVED_FOR_REFUND", "REFUND_PROCESSING");
    private static final Set<String> REPLACEMENT_OPEN_STATUSES = Set.of(
            "REQUESTED", "APPROVED", "PROCESSING", "SHIPPED");

    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final OrderStatusHistoryRepository history;
    private final OrderNoteRepository notes;
    private final OrderStateMachine stateMachine;
    private final CheckoutService checkout;
    private final CartService carts;
    private final InventoryService inventory;
    private final CouponService coupons;
    private final NotificationService notifications;
    private final RefundService refundService;
    private final DeliveryAddressRepository deliveryAddresses;
    private final ShipmentRepository shipments;
    private final ShipmentTrackingEventRepository trackingEvents;
    private final PaymentRepository payments;
    private final UserRepository users;
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ReturnRequestRepository returnRequests;
    private final ReplacementRepository replacements;
    private final InvoiceRepository invoices;
    private final com.ivanta.delivery.ShippingMethodRepository shippingMethods;
    private final IdService ids;
    private final AuditService audit;
    private final IvantaProperties props;

    /* ---------- placement (§22/§46) ---------- */

    @Transactional
    public OrderDetail place(String userId, PlaceOrderRequest req) {
        CheckoutService.Context ctx = checkout.buildContext(userId, req.addressId(),
                req.shippingMethodId(), req.couponCode(), req.paymentMethod(), true);

        boolean cod = "COD".equals(ctx.paymentMethod());
        Order o = new Order();
        o.setId(ids.next("orders", "ORD-" + Year.now().getValue(), 6));
        o.setOrderNumber(nextOrderNumber());
        o.setUserId(userId);
        o.setStatus(cod ? "PLACED" : "PENDING_PAYMENT");
        o.setSubtotal(ctx.subtotal());
        o.setCouponCode(ctx.couponCode());
        o.setCouponDiscount(ctx.couponDiscount());
        o.setDiscountTotal(ctx.couponDiscount());
        o.setTaxTotal(ctx.taxTotal());
        o.setShippingFee(ctx.shippingFee());
        o.setGrandTotal(ctx.grandTotal());
        o.setPaymentMethod(ctx.paymentMethod());
        o.setPaymentStatus("PENDING");
        o.setShippingStatus("PENDING");
        o.setShippingMethodId(ctx.method() == null ? null : ctx.method().getId());
        users.findById(userId).ifPresent(u -> {
            o.setContactEmail(u.getEmail());
            o.setContactPhone(u.getPhone());
        });
        o.setCustomerNote(req.customerNote());
        o.setPlacedAt(Instant.now());
        int etaDays = ctx.method() == null ? 5 : ctx.method().getEtaMaxDays();
        if (ctx.serviceability() != null && ctx.serviceability().etaMaxDays() != null)
            etaDays = Math.max(etaDays, ctx.serviceability().etaMaxDays());
        o.setExpectedDelivery(LocalDate.now().plusDays(etaDays));
        orders.save(o);

        // line items with full snapshots (§24) — name, sku, variant, color, storage, prices
        List<InventoryService.ReserveLine> reserveLines = new ArrayList<>();
        for (CheckoutService.Line l : ctx.lines()) {
            OrderItem oi = new OrderItem();
            oi.setId(ids.next("order_items", "OIT", 6));
            oi.setOrderId(o.getId());
            oi.setProductId(l.productId());
            oi.setVariantId(l.variantId());
            oi.setProductName(l.productName());
            oi.setVariantName(l.variantName());
            if (l.variantId() != null)
                variants.findById(l.variantId()).ifPresent(v -> {
                    oi.setColor(v.getColor());
                    oi.setStorage(v.getStorage());
                });
            oi.setSku(l.sku());
            oi.setImageKey(l.imageKey());
            oi.setQuantity(l.quantity());
            oi.setUnitPrice(l.unitPrice());
            oi.setDiscount(BigDecimal.ZERO);
            oi.setTaxRate(l.taxRate());
            oi.setTaxAmount(l.taxAmount());
            oi.setFinalPrice(l.lineTotal().add(l.taxAmount()));
            orderItems.save(oi);
            reserveLines.add(new InventoryService.ReserveLine(l.productId(), l.variantId(),
                    l.quantity(), l.productName()));
        }

        // address snapshot (§7 delivery_addresses) — immutable for the life of the order
        Address a = ctx.address();
        DeliveryAddress da = new DeliveryAddress();
        da.setId(ids.next("delivery_addresses", "DAD", 5));
        da.setOrderId(o.getId());
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
        o.setShippingAddressId(da.getId());
        orders.save(o);

        // stock reservation with TTL (§14)
        inventory.reserveForOrder(o.getId(), reserveLines, props.getCheckout().getReservationTtlMinutes());

        // coupon usage (§32)
        if (ctx.couponCode() != null)
            coupons.recordUsage(ctx.couponCode(), o.getId(), userId, ctx.couponDiscount());

        // payment handling per method
        if (cod) {
            Payment p = new Payment();
            p.setId(ids.next("payments", "PAY", 5));
            p.setOrderId(o.getId());
            p.setUserId(userId);
            p.setAmount(o.getGrandTotal());
            p.setMethod("COD");
            p.setProvider("cod");
            p.setStatus("PENDING");
            payments.save(p);
            stateMachine.recordInitial(o, "CUSTOMER", userId);
            stateMachine.apply(o, "CONFIRMED", "SYSTEM", null, "Cash on Delivery — auto-confirmed");
            inventory.consumeForOrder(o.getId());       // COD stock commits immediately
        } else {
            stateMachine.recordInitial(o, "CUSTOMER", userId);
        }

        // cart done
        carts.completeOrder(userId);

        audit.record("ORDER_CREATED", "order", o.getId(), null,
                "number=" + o.getOrderNumber() + " total=" + o.getGrandTotal() + " method=" + o.getPaymentMethod());
        notifications.notifyUser(userId, "ORDER_PLACED",
                Map.of("name", userName(userId), "orderNumber", displayNumber(o)), "order", o.getId());
        if (cod)
            notifications.notifyUser(userId, "ORDER_CONFIRMED",
                    Map.of("orderNumber", displayNumber(o)), "order", o.getId());
        return toDetail(o, false);
    }

    /** IVN-YYYYMMDD-NNNNNN — per-day atomic sequence, collision-seeded by V18. */
    private String nextOrderNumber() {
        String day = DateTimeFormatter.BASIC_ISO_DATE.format(LocalDate.now());
        return ids.next("orders", "IVN-" + day, 6);
    }

    public String displayNumber(Order o) {
        return o.getOrderNumber() != null ? o.getOrderNumber() : o.getId();
    }

    /* ---------- customer queries ---------- */

    @Transactional(readOnly = true)
    public ProductDtos.PageResponse<OrderSummary> listForUser(String userId, String q, String status,
                                                              String from, String to, int page, int size) {
        Page<Order> p = orders.searchForUser(userId, blankToNull(q), blankToNull(status),
                parseFrom(from), parseTo(to),
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50)));
        return new ProductDtos.PageResponse<>(p.getContent().stream().map(o -> toSummary(o, null)).toList(),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    /** IDOR guard (§54): customers only ever see their own orders. */
    @Transactional(readOnly = true)
    public OrderDetail getForUser(String userId, String orderId) {
        return toDetail(findForUser(userId, orderId), false);
    }

    @Transactional(readOnly = true)
    public List<TimelineEvent> timelineForUser(String userId, String orderId) {
        return buildTimeline(findForUser(userId, orderId));
    }

    private Order findForUser(String userId, String orderId) {
        return orders.findByIdAndUserId(orderId, userId)
                .or(() -> orders.findByOrderNumber(orderId).filter(o -> o.getUserId().equals(userId)))
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId));
    }

    @Transactional
    public OrderDetail cancelByCustomer(String userId, String orderId, String reason) {
        Order o = findForUser(userId, orderId);
        String r = reason == null ? "Cancelled by customer" : reason;
        if (OrderStateMachine.CUSTOMER_CANCELLABLE.contains(o.getStatus())) {
            doCancel(o, "CUSTOMER", userId, r);
        } else if (OrderStateMachine.CUSTOMER_CANCEL_REQUESTABLE.contains(o.getStatus())) {
            // post-shipment: customers REQUEST cancellation, admin approves/rejects (§18)
            stateMachine.apply(o, "CANCEL_REQUESTED", "CUSTOMER", userId, r);
            audit.record("ORDER_CANCEL_REQUESTED", "order", o.getId(), null, r);
            notifications.notifyUser(userId, "CANCEL_REQUESTED",
                    Map.of("orderNumber", displayNumber(o)), "order", o.getId());
        } else {
            throw new InvalidStateException("Order " + orderId + " can no longer be cancelled (status: "
                    + o.getStatus() + ")");
        }
        return toDetail(o, false);
    }

    /* ---------- admin ---------- */

    @Transactional(readOnly = true)
    public ProductDtos.PageResponse<OrderSummary> adminList(String q, String status, String paymentStatus,
                                                            String from, String to, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        Page<Order> p = orders.searchForAdmin(blankToNull(q), blankToNull(status), blankToNull(paymentStatus),
                parseFrom(from), parseTo(to), pr);
        java.util.Map<String, String> names = new java.util.HashMap<>();
        for (com.ivanta.auth.User u : users.findAllById(
                p.getContent().stream().map(Order::getUserId).distinct().toList()))
            names.put(u.getId(), u.getName());
        return new ProductDtos.PageResponse<>(
                p.getContent().stream().map(o -> toSummary(o, names.get(o.getUserId()))).toList(),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    @Transactional(readOnly = true)
    public OrderDetail adminGet(String orderId) {
        return toDetail(findForAdmin(orderId), true);
    }

    @Transactional(readOnly = true)
    public List<TimelineEvent> timelineForAdmin(String orderId) {
        return buildTimeline(findForAdmin(orderId));
    }

    private Order findForAdmin(String orderId) {
        return orders.findById(orderId)
                .or(() -> orders.findByOrderNumber(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId));
    }

    @Transactional
    public OrderDetail cancelByAdmin(String orderId, String reason, String adminId) {
        Order o = findForAdmin(orderId);
        Set<String> adminCancellable = new HashSet<>(OrderStateMachine.CUSTOMER_CANCELLABLE);
        adminCancellable.add("PACKED");
        adminCancellable.add("CANCEL_REQUESTED");   // approving a customer cancel request
        if (!adminCancellable.contains(o.getStatus()))
            throw new InvalidStateException("Order " + orderId + " cannot be cancelled at status " + o.getStatus());
        doCancel(o, "ADMIN", adminId, reason == null ? "Cancelled by admin" : reason);
        return toDetail(o, true);
    }

    /**
     * Admin status advance (§23/§45). Guards: payment statuses only via payment
     * verification, shipment statuses only via delivery endpoints (except when
     * rejecting a CANCEL_REQUESTED), return/refund/replacement statuses only via
     * their workflows — nobody can fake these from the admin UI either.
     */
    @Transactional
    public OrderDetail adminUpdateStatus(String orderId, String status, String reason, String adminId) {
        Order o = findForAdmin(orderId);
        switch (status) {
            case "CONFIRMED", "PROCESSING", "PACKED" -> { /* allowed */ }
            case "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY" -> {
                if (!"CANCEL_REQUESTED".equals(o.getStatus()))
                    throw new InvalidStateException("SHIPPED".equals(status)
                            ? "Use POST /admin/delivery/orders/{id}/ship to create the shipment"
                            : "Delivery statuses are driven by shipment tracking events");
                // rejecting a cancel request resumes the delivery leg
            }
            case "PENDING_PAYMENT", "PAYMENT_FAILED", "PLACED" -> throw new InvalidStateException(
                    "Payment-driven statuses are set only by the payment workflow");
            case "DELIVERED" -> throw new InvalidStateException(
                    "Delivery statuses are driven by shipment tracking events");
            case "CANCEL_REQUESTED" -> throw new InvalidStateException(
                    "Cancellation requests are raised by customers");
            case "CANCELLED" -> throw new InvalidStateException(
                    "Use the cancel endpoint to cancel with stock/refund side effects");
            case "REFUND_INITIATED", "REFUNDED" -> throw new InvalidStateException(
                    "Refund statuses are driven by the returns/refund workflow");
            default -> {
                if (status != null && status.startsWith("RETURN_"))
                    throw new InvalidStateException("Return statuses are driven by the returns workflow");
                if (status != null && status.startsWith("REPLACEMENT_"))
                    throw new InvalidStateException("Replacement statuses are driven by the replacement workflow");
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unknown status " + status);
            }
        }
        stateMachine.apply(o, status, "ADMIN", adminId, reason);
        String dn = displayNumber(o);
        switch (status) {
            case "CONFIRMED" -> notifications.notifyUser(o.getUserId(), "ORDER_CONFIRMED",
                    Map.of("orderNumber", dn), "order", o.getId());
            case "PROCESSING" -> notifications.notifyUser(o.getUserId(), "ORDER_PROCESSING",
                    Map.of("orderNumber", dn), "order", o.getId());
            case "PACKED" -> notifications.notifyUser(o.getUserId(), "ORDER_PACKED",
                    Map.of("orderNumber", dn), "order", o.getId());
            case "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY" ->
                    notifications.notifyUser(o.getUserId(), "CANCEL_REQUEST_RESOLVED",
                            Map.of("orderNumber", dn, "status", "rejected — delivery resumed"), "order", o.getId());
            default -> { }
        }
        return toDetail(o, true);
    }

    /** Scheduler entrypoint: reservation expired (§14). */
    @Transactional
    public void cancelSystem(String orderId, String reason) {
        orders.findById(orderId).ifPresent(o -> {
            if (Set.of("PENDING_PAYMENT", "PAYMENT_FAILED").contains(o.getStatus()))
                doCancel(o, "SYSTEM", null, reason);
        });
    }

    /* ---------- notes (admin) ---------- */

    @Transactional
    public List<NoteView> addNote(String orderId, String note, String adminId) {
        Order o = findForAdmin(orderId);
        OrderNote n = new OrderNote();
        n.setOrderId(o.getId());
        n.setNote(note);
        n.setAddedByType("ADMIN");
        n.setAddedBy(adminId);
        n.setVisibility("INTERNAL");
        notes.save(n);
        audit.record("ORDER_NOTE_ADDED", "order", o.getId(), null, note);
        return noteViews(o.getId());
    }

    private List<NoteView> noteViews(String orderId) {
        return notes.findByOrderIdOrderByIdAsc(orderId).stream()
                .map(n -> new NoteView(n.getId(), n.getNote(), n.getAddedByType(), n.getAddedBy(),
                        n.getVisibility(), n.getCreatedAt().toString()))
                .toList();
    }

    /* ---------- cancellation side effects ---------- */

    private void doCancel(Order o, String byType, String byId, String reason) {
        // release held stock, or restock already-consumed stock (COD/paid)
        boolean hadReservation = !inventory.hasOpenReservation(o.getId());
        if (!hadReservation) {
            inventory.releaseForOrder(o.getId(), false);
        } else {
            for (OrderItem oi : orderItems.findByOrderId(o.getId()))
                inventory.receiveReturn(o.getId(), oi.getVariantId(), oi.getProductId(),
                        oi.getQuantity(), "Cancellation restock: " + reason);
        }
        stateMachine.apply(o, "CANCELLED", byType, byId, reason);

        // refund prepaid money (§31): CANCELLED -> REFUND_INITIATED -> REFUNDED
        Optional<Payment> paid = payments.findFirstByOrderIdOrderByIdDesc(o.getId())
                .filter(p -> "SUCCESS".equals(p.getStatus()));
        if (paid.isPresent()) {
            stateMachine.apply(o, "REFUND_INITIATED", "SYSTEM", null, "Refund initiated for cancellation");
            notifications.notifyUser(o.getUserId(), "REFUND_INITIATED",
                    Map.of("orderNumber", displayNumber(o), "amount", o.getGrandTotal().toPlainString()),
                    "order", o.getId());
            Refund r = refundService.refundOrder(o, o.getGrandTotal(), reason, null);
            if ("SUCCESS".equals(r.getStatus()))
                stateMachine.apply(o, "REFUNDED", "SYSTEM", null, "Cancellation refund completed");
        }
        audit.record("ORDER_CANCELLED", "order", o.getId(), null, reason);
        notifications.notifyUser(o.getUserId(), "ORDER_CANCELLED",
                Map.of("orderNumber", displayNumber(o), "reason", reason), "order", o.getId());
    }

    /* ---------- mappers ---------- */

    public OrderSummary toSummary(Order o, String customerName) {
        List<OrderItem> its = orderItems.findByOrderId(o.getId());
        OrderItem first = its.isEmpty() ? null : its.get(0);
        return new OrderSummary(o.getId(), o.getOrderNumber(), o.getPlacedAt().toString(), o.getStatus(),
                o.getPaymentStatus(), o.getShippingStatus(), o.getGrandTotal(),
                o.getPaymentMethod(), its.stream().mapToInt(OrderItem::getQuantity).sum(),
                first == null ? null : first.getProductName(),
                first == null ? null : first.getImageKey(),
                o.getExpectedDelivery() == null ? null : o.getExpectedDelivery().toString(), customerName);
    }

    @Transactional(readOnly = true)
    public OrderDetail toDetail(Order o, boolean includeCustomer) {
        List<OrderItemView> items = orderItems.findByOrderId(o.getId()).stream().map(oi -> {
            String slug = products.findById(oi.getProductId()).map(p -> p.getSlug()).orElse(null);
            return new OrderItemView(oi.getId(), oi.getProductId(), oi.getProductName(), slug,
                    oi.getVariantId(), oi.getVariantName(), oi.getColor(), oi.getStorage(),
                    oi.getSku(), oi.getImageKey(),
                    oi.getQuantity(), oi.getUnitPrice(), oi.getDiscount(), oi.getTaxAmount(),
                    oi.getFinalPrice());
        }).toList();

        AddressView addr = deliveryAddresses.findByOrderId(o.getId())
                .map(da -> new AddressView(da.getId(), da.getName(), da.getPhone(), da.getAddressLine1(),
                        da.getAddressLine2(), da.getLocality(), da.getRoad(), da.getCity(), da.getDistrict(),
                        da.getState(), da.getPincode(), da.getCountry(), da.getLandmark(),
                        da.getAddressType(), false, da.getLatitude(), da.getLongitude()))
                .orElse(null);

        List<StatusHistoryView> hist = history.findByOrderIdOrderByIdAsc(o.getId()).stream()
                .map(h -> new StatusHistoryView(h.getPreviousStatus(), h.getNewStatus(),
                        h.getChangedByType(), h.getChangedBy(), h.getReason(), h.getCreatedAt().toString()))
                .toList();

        String paymentStatus = o.getPaymentStatus() != null ? o.getPaymentStatus()
                : payments.findFirstByOrderIdOrderByIdDesc(o.getId()).map(Payment::getStatus).orElse(null);

        return new OrderDetail(o.getId(), o.getOrderNumber(),
                includeCustomer ? o.getUserId() : null,
                includeCustomer ? userName(o.getUserId()) : null,
                o.getPlacedAt().toString(), o.getStatus(), o.getSubtotal(), o.getDiscountTotal(),
                o.getCouponCode(), o.getCouponDiscount(), o.getTaxTotal(), o.getShippingFee(),
                o.getGrandTotal(), o.getCurrency(), o.getPaymentMethod(), paymentStatus,
                o.getShippingStatus(), shippingMethodName(o.getShippingMethodId()),
                o.getExpectedDelivery() == null ? null : o.getExpectedDelivery().toString(),
                o.getCancellationReason(),
                o.getContactEmail(), o.getContactPhone(), o.getCustomerNote(),
                o.getConfirmedAt() == null ? null : o.getConfirmedAt().toString(),
                o.getShippedAt() == null ? null : o.getShippedAt().toString(),
                o.getDeliveredAt() == null ? null : o.getDeliveredAt().toString(),
                o.getCancelledAt() == null ? null : o.getCancelledAt().toString(),
                returnEligible(o),
                invoices.findByOrderId(o.getId()).map(i -> i.getId()).orElse(null),
                items, addr, hist, buildTimeline(o),
                includeCustomer ? noteViews(o.getId()) : null);
    }

    private String shippingMethodName(String methodId) {
        if (methodId == null) return null;
        return shippingMethods.findById(methodId).map(m -> m.getName()).orElse(methodId);
    }

    /** Timeline from REAL backend data only (§9): status ledger + payments + shipment events. */
    private List<TimelineEvent> buildTimeline(Order o) {
        List<TimelineEvent> timeline = new ArrayList<>();
        history.findByOrderIdOrderByIdAsc(o.getId()).forEach(h ->
                timeline.add(new TimelineEvent("STATUS", h.getNewStatus(), h.getReason(), h.getCreatedAt().toString())));
        payments.findByOrderId(o.getId()).forEach(p ->
                timeline.add(new TimelineEvent("PAYMENT", p.getStatus(),
                        p.getMethod() + " payment " + p.getAmount().toPlainString()
                                + (p.getProviderTransactionId() == null ? "" : " · ref " + p.getProviderTransactionId()),
                        (p.getProcessedAt() != null ? p.getProcessedAt() : p.getCreatedAt()).toString())));
        shipments.findFirstByOrderIdOrderByIdDesc(o.getId()).ifPresent(s -> {
            timeline.add(new TimelineEvent("SHIPMENT", s.getStatus(),
                    "Tracking " + s.getTrackingNumber() + (s.getCarrier() == null ? "" : " · " + s.getCarrier()),
                    s.getCreatedAt() == null ? Instant.now().toString() : s.getCreatedAt().toString()));
            trackingEvents.findByShipmentIdOrderByIdAsc(s.getId()).forEach(e ->
                    timeline.add(new TimelineEvent("SHIPMENT", e.getStatus(),
                            (e.getDescription() == null ? "" : e.getDescription())
                                    + (e.getLocation() == null ? "" : " · " + e.getLocation()),
                            e.getEventAt().toString())));
        });
        timeline.sort(Comparator.comparing(TimelineEvent::at));
        return timeline;
    }

    /** Server-computed return eligibility (§19): status + window (per-product override) + no open return/replacement. */
    @Transactional(readOnly = true)
    public boolean returnEligible(Order o) {
        if (!"DELIVERED".equals(o.getStatus())) return false;
        Instant deliveredAt = o.getDeliveredAt() != null ? o.getDeliveredAt()
                : shipments.findFirstByOrderIdOrderByIdDesc(o.getId())
                        .map(s -> s.getDeliveredAt() == null ? o.getPlacedAt() : s.getDeliveredAt())
                        .orElse(o.getPlacedAt());
        int window = returnWindowDaysFor(o);
        if (Instant.now().isAfter(deliveredAt.plus(window, ChronoUnit.DAYS))) return false;
        boolean openReturn = returnRequests.findByOrderId(o.getId()).stream()
                .anyMatch(r -> RETURN_OPEN_STATUSES.contains(r.getStatus()));
        boolean openReplacement = replacements.findByOrderId(o.getId()).stream()
                .anyMatch(r -> REPLACEMENT_OPEN_STATUSES.contains(r.getStatus()));
        return !openReturn && !openReplacement;
    }

    /** Per-product override (§19) falling back to the global configured window. */
    public int returnWindowDaysFor(Order o) {
        Integer override = orderItems.findByOrderId(o.getId()).stream()
                .map(oi -> products.findById(oi.getProductId()).map(p -> p.getReturnWindowDays()).orElse(null))
                .filter(Objects::nonNull)
                .findFirst().orElse(null);
        return override != null ? override : props.getReturns().getWindowDays();
    }

    /* ---------- helpers ---------- */

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static Instant parseFrom(String date) {
        try {
            return date == null || date.isBlank() ? null
                    : LocalDate.parse(date).atStartOfDay(ZoneOffset.UTC).toInstant();
        } catch (Exception e) { return null; }
    }

    private static Instant parseTo(String date) {
        try {
            return date == null || date.isBlank() ? null
                    : LocalDate.parse(date).atTime(LocalTime.MAX).toInstant(ZoneOffset.UTC);
        } catch (Exception e) { return null; }
    }

    private String userName(String userId) {
        return users.findById(userId).map(u -> u.getName()).orElse("Customer");
    }
}
