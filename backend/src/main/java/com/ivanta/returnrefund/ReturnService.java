package com.ivanta.returnrefund;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.delivery.ShipmentRepository;
import com.ivanta.dto.ReturnDtos.*;
import com.ivanta.inventory.InventoryService;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderItem;
import com.ivanta.order.OrderItemRepository;
import com.ivanta.order.OrderRepository;
import com.ivanta.order.OrderStateMachine;
import com.ivanta.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Returns (§30): window-checked, state-machined, restocking on RECEIVED and
 * refund hand-off at REFUND_PROCESSING. Rejection sends the order back to DELIVERED.
 */
@Service
@RequiredArgsConstructor
public class ReturnService {

    public static final Map<String, Set<String>> TRANSITIONS = Map.ofEntries(
            Map.entry("REQUESTED", Set.of("APPROVED", "REJECTED")),
            Map.entry("APPROVED", Set.of("PICKUP_SCHEDULED", "REJECTED")),
            Map.entry("PICKUP_SCHEDULED", Set.of("PICKED_UP", "RECEIVED", "REJECTED")),
            Map.entry("PICKED_UP", Set.of("RECEIVED")),
            Map.entry("RECEIVED", Set.of("INSPECTION")),
            Map.entry("INSPECTION", Set.of("APPROVED_FOR_REFUND", "REJECTED")),
            Map.entry("APPROVED_FOR_REFUND", Set.of("REFUND_PROCESSING")),
            Map.entry("REFUND_PROCESSING", Set.of("REFUNDED", "CLOSED")),
            Map.entry("REJECTED", Set.of("CLOSED")),
            Map.entry("REFUNDED", Set.of("CLOSED")),
            Map.entry("CLOSED", Set.of()));

    private static final Set<String> OPEN_STATUSES =
            Set.of("REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "RECEIVED", "INSPECTION",
                    "APPROVED_FOR_REFUND", "REFUND_PROCESSING");

    private final ReturnRequestRepository returns;
    private final ReturnItemRepository returnItems;
    private final RefundRepository refunds;
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final OrderStateMachine stateMachine;
    private final ShipmentRepository shipments;
    private final InventoryService inventory;
    private final RefundService refundService;
    private final NotificationService notifications;
    private final ProductRepository products;
    private final IvantaProperties props;
    private final IdService ids;
    private final AuditService audit;

    /* ---------- customer ---------- */

    @Transactional
    public ReturnView request(String userId, ReturnCreateRequest req) {
        Order order = orders.findByIdAndUserId(req.orderId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + req.orderId()));
        if (!"DELIVERED".equals(order.getStatus()))
            throw new BusinessException(ErrorCode.RETURN_NOT_ALLOWED,
                    "Only delivered orders can be returned (current status: " + order.getStatus() + ")");

        Instant deliveredAt = shipments.findFirstByOrderIdOrderByIdDesc(order.getId())
                .map(s -> s.getDeliveredAt() == null ? order.getPlacedAt() : s.getDeliveredAt())
                .orElse(order.getDeliveredAt() == null ? order.getPlacedAt() : order.getDeliveredAt());
        int windowDays = windowDaysFor(order);
        Instant windowEnd = deliveredAt.plus(windowDays, ChronoUnit.DAYS);
        if (Instant.now().isAfter(windowEnd))
            throw new BusinessException(ErrorCode.RETURN_NOT_ALLOWED,
                    "The " + windowDays + "-day return window for this order has closed");

        boolean hasOpen = returns.findByOrderId(order.getId()).stream()
                .anyMatch(r -> OPEN_STATUSES.contains(r.getStatus()));
        if (hasOpen)
            throw new BusinessException(ErrorCode.CONFLICT, "A return is already open for this order");

        ReturnRequest r = new ReturnRequest();
        r.setId(ids.next("return_requests", "RET", 5));
        r.setOrderId(order.getId());
        r.setUserId(userId);
        r.setReason(req.reason().trim());
        r.setCustomerNotes(req.notes());
        r.setRequestedAt(Instant.now());
        returns.save(r);

        List<OrderItem> items = orderItems.findByOrderId(order.getId());
        Set<String> chosen = req.itemIds() == null ? Set.of() : Set.copyOf(req.itemIds());
        List<OrderItem> selected = items.stream()
                .filter(oi -> chosen.isEmpty() || chosen.contains(oi.getId()))
                .toList();
        if (selected.isEmpty())
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Select at least one item to return");

        // Refund amounts are pro-rated with the order-level coupon discount so the
        // total can never exceed what was actually captured (§26). Full returns also
        // refund shipping, with rounding absorbed by the last line (penny adjustment).
        BigDecimal subtotal = order.getSubtotal() == null ? BigDecimal.ZERO : order.getSubtotal();
        BigDecimal discount = order.getCouponDiscount() == null ? BigDecimal.ZERO : order.getCouponDiscount();
        BigDecimal factor = subtotal.signum() > 0
                ? subtotal.subtract(discount).divide(subtotal, 6, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ONE;
        boolean fullReturn = selected.size() == items.size();

        BigDecimal total = BigDecimal.ZERO;
        ReturnItem last = null;
        for (OrderItem oi : selected) {
            ReturnItem ri = new ReturnItem();
            ri.setId(ids.next("return_items", "RIT", 6));
            ri.setReturnId(r.getId());
            ri.setOrderItemId(oi.getId());
            ri.setProductName(oi.getProductName());
            ri.setVariantName(oi.getVariantName());
            ri.setQuantity(oi.getQuantity());
            BigDecimal line = oi.getFinalPrice().multiply(factor)
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            ri.setRefundAmount(line);
            returnItems.save(ri);
            total = total.add(line);
            last = ri;
        }
        if (fullReturn && last != null && order.getGrandTotal() != null) {
            BigDecimal delta = order.getGrandTotal().subtract(total);
            last.setRefundAmount(last.getRefundAmount().add(delta));
            returnItems.save(last);
            total = order.getGrandTotal();
        }
        if (total.compareTo(BigDecimal.ZERO) <= 0)
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Select at least one item to return");

        stateMachine.apply(order, "RETURN_REQUESTED", "CUSTOMER", userId, req.reason());
        audit.record("RETURN_REQUESTED", "return_request", r.getId(), null,
                "order=" + order.getId() + " amount=" + total);
        notifications.notifyUser(userId, "RETURN_REQUESTED",
                Map.of("returnNumber", r.getId(), "orderNumber", displayNumber(order)),
                "return", r.getId());
        return toView(r);
    }

    @Transactional(readOnly = true)
    public List<ReturnView> listForUser(String userId) {
        return returns.findByUserIdOrderByIdDesc(userId).stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public ReturnView getForUser(String userId, String returnId) {
        ReturnRequest r = returns.findById(returnId)
                .filter(x -> x.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Return " + returnId));
        return toView(r);
    }

    /* ---------- admin (§34) ---------- */

    @Transactional
    public ReturnView updateStatus(String returnId, ReturnStatusUpdate req, String adminId) {
        ReturnRequest r = returns.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Return " + returnId));
        String from = r.getStatus();
        String to = req.status();
        if (!TRANSITIONS.getOrDefault(from, Set.of()).contains(to))
            throw new BusinessException(ErrorCode.INVALID_STATE,
                    "Cannot move return from " + from + " to " + to);

        Order order = orders.findById(r.getOrderId()).orElseThrow();
        r.setStatus(to);
        if (req.inspectionNotes() != null) r.setInspectionNotes(req.inspectionNotes());
        String dn = displayNumber(order);

        switch (to) {
            case "APPROVED" -> {
                stateMachine.apply(order, "RETURN_APPROVED", "ADMIN", adminId, "Return " + r.getId() + " approved");
                notifications.notifyUser(r.getUserId(), "RETURN_APPROVED",
                        Map.of("returnNumber", r.getId(), "orderNumber", dn), "return", r.getId());
            }
            case "PICKUP_SCHEDULED" ->
                stateMachine.apply(order, "RETURN_PICKUP_SCHEDULED", "ADMIN", adminId, "Return pickup scheduled");
            case "PICKED_UP" ->
                stateMachine.apply(order, "RETURN_PICKED_UP", "ADMIN", adminId, "Return picked up");
            case "RECEIVED" -> {
                // restock returned units (§27 movement type RETURN)
                for (ReturnItem ri : returnItems.findByReturnId(r.getId())) {
                    OrderItem oi = orderItems.findById(ri.getOrderItemId()).orElse(null);
                    if (oi != null)
                        inventory.receiveReturn(order.getId(), oi.getVariantId(), oi.getProductId(),
                                ri.getQuantity(), "Return " + r.getId() + " received");
                }
                stateMachine.apply(order, "RETURN_RECEIVED", "ADMIN", adminId, "Return received at fulfilment centre");
            }
            case "INSPECTION" ->
                stateMachine.apply(order, "RETURN_INSPECTION", "ADMIN", adminId, "Return under inspection");
            case "APPROVED_FOR_REFUND" -> {
                BigDecimal total = returnItems.findByReturnId(r.getId()).stream()
                        .map(ReturnItem::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                stateMachine.apply(order, "REFUND_INITIATED", "ADMIN", adminId,
                        "Return " + r.getId() + " approved for refund");
                notifications.notifyUser(r.getUserId(), "REFUND_INITIATED",
                        Map.of("orderNumber", dn, "amount", total.toPlainString()), "return", r.getId());
            }
            case "REJECTED" -> {
                stateMachine.apply(order, "DELIVERED", "ADMIN", adminId,
                        "Return " + r.getId() + " rejected");
            }
            case "REFUND_PROCESSING" -> {
                BigDecimal total = returnItems.findByReturnId(r.getId()).stream()
                        .map(ReturnItem::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                Refund refund = refundService.refundOrder(order, total, "Return " + r.getId(), r.getId());
                if ("SUCCESS".equals(refund.getStatus())) {
                    r.setStatus("REFUNDED");
                    boolean full = total.compareTo(order.getGrandTotal()) >= 0;
                    stateMachine.apply(order, full ? "REFUNDED" : "DELIVERED", "ADMIN", adminId,
                            full ? "Return refund completed" : "Partial return refund completed");
                    notifications.notifyUser(r.getUserId(), "REFUND_SUCCESS",
                            Map.of("orderNumber", dn, "amount", total.toPlainString()), "return", r.getId());
                }
            }
            case "REFUNDED", "CLOSED" -> r.setResolvedAt(Instant.now());
            default -> { }
        }
        returns.save(r);
        audit.record("RETURN_STATUS_CHANGED", "return_request", r.getId(), from, to);
        if (!Set.of("APPROVED", "APPROVED_FOR_REFUND", "REFUND_PROCESSING").contains(to))
            notifications.notifyUser(r.getUserId(), "RETURN_UPDATE",
                    Map.of("returnNumber", r.getId(), "orderNumber", dn, "status", to),
                    "return", r.getId());
        return toView(r);
    }

    @Transactional(readOnly = true)
    public List<ReturnView> adminList(String status, String orderId, int limit) {
        if (orderId != null && !orderId.isBlank())
            return returns.findByOrderId(orderId).stream()
                    .filter(r -> status == null || status.isBlank() || status.equals(r.getStatus()))
                    .map(this::toView).toList();
        var page = org.springframework.data.domain.PageRequest.of(0, Math.min(limit, 200));
        return (status == null || status.isBlank()
                ? returns.findAllByOrderByIdDesc(page)
                : returns.findByStatusOrderByIdDesc(status, page))
                .getContent().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<RefundView> refundsForUser(String userId) {
        return refunds.findByUser(userId).stream().map(ReturnService::toRefundView).toList();
    }

    @Transactional(readOnly = true)
    public List<RefundView> adminRefunds(String orderId, int limit) {
        if (orderId != null && !orderId.isBlank())
            return refunds.findByOrderId(orderId).stream().map(ReturnService::toRefundView).toList();
        return refunds.findAllByOrderByIdDesc(org.springframework.data.domain.PageRequest.of(0, Math.min(limit, 200)))
                .getContent().stream().map(ReturnService::toRefundView).toList();
    }

    /** Per-product return-window override (§19), falling back to the global setting. */
    private int windowDaysFor(Order order) {
        Integer override = orderItems.findByOrderId(order.getId()).stream()
                .map(oi -> products.findById(oi.getProductId())
                        .map(pr -> pr.getReturnWindowDays()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .findFirst().orElse(null);
        return override != null ? override : props.getReturns().getWindowDays();
    }

    private static String displayNumber(Order o) {
        return o.getOrderNumber() != null ? o.getOrderNumber() : o.getId();
    }

    /* ---------- mappers ---------- */

    public ReturnView toView(ReturnRequest r) {
        List<ReturnItemView> items = returnItems.findByReturnId(r.getId()).stream()
                .map(i -> new ReturnItemView(i.getId(), i.getOrderItemId(), i.getProductName(),
                        i.getVariantName(), i.getQuantity(), i.getRefundAmount()))
                .toList();
        List<RefundView> rs = refunds.findByOrderId(r.getOrderId()).stream()
                .map(ReturnService::toRefundView).toList();
        return new ReturnView(r.getId(), r.getOrderId(), r.getStatus(), r.getReason(), r.getCustomerNotes(),
                r.getInspectionNotes(), r.getRequestedAt().toString(),
                r.getResolvedAt() == null ? null : r.getResolvedAt().toString(), items, rs);
    }

    public static RefundView toRefundView(Refund r) {
        return new RefundView(r.getId(), r.getOrderId(), r.getAmount().setScale(2, RoundingMode.HALF_UP),
                r.getStatus(), r.getMethod(), r.getProvider(), r.getProviderTransactionId(),
                r.getFailureReason(), r.getCreatedAt().toString(),
                r.getProcessedAt() == null ? null : r.getProcessedAt().toString());
    }
}
