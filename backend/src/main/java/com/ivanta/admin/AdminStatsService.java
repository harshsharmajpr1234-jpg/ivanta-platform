package com.ivanta.admin;

import com.ivanta.category.Category;
import com.ivanta.category.CategoryRepository;
import com.ivanta.dto.AdminOpsDtos.*;
import com.ivanta.inventory.InventoryItemRepository;
import com.ivanta.order.Order;
import com.ivanta.order.OrderItemRepository;
import com.ivanta.order.OrderRepository;
import com.ivanta.payment.PaymentRepository;
import com.ivanta.product.ProductRepository;
import com.ivanta.returnrefund.RefundRepository;
import com.ivanta.returnrefund.ReturnRequestRepository;
import com.ivanta.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Dashboard + report metrics (§37). */
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    /** Orders that count towards revenue: placed-or-beyond, excluding failed/cancelled/refunded. */
    private static final List<String> REVENUE_STATUSES = List.of(
            "PLACED", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT",
            "OUT_FOR_DELIVERY", "DELIVERED", "CANCEL_REQUESTED",
            "RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_PICKUP_SCHEDULED", "RETURN_PICKED_UP",
            "RETURN_RECEIVED", "RETURN_INSPECTION", "REFUND_INITIATED",
            "REPLACEMENT_REQUESTED", "REPLACEMENT_PROCESSING", "REPLACEMENT_SHIPPED", "REPLACEMENT_DELIVERED");

    private static final List<String> ALL_STATUSES = List.of(
            "PENDING_PAYMENT", "PAYMENT_FAILED", "PLACED", "CONFIRMED", "PROCESSING", "PACKED",
            "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCEL_REQUESTED", "CANCELLED",
            "RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_PICKUP_SCHEDULED", "RETURN_PICKED_UP",
            "RETURN_RECEIVED", "RETURN_INSPECTION", "REFUND_INITIATED", "REFUNDED",
            "REPLACEMENT_REQUESTED", "REPLACEMENT_PROCESSING", "REPLACEMENT_SHIPPED", "REPLACEMENT_DELIVERED");

    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final PaymentRepository payments;
    private final RefundRepository refunds;
    private final ReturnRequestRepository returns;
    private final com.ivanta.replacement.ReplacementRepository replacements;
    private final InventoryItemRepository inventory;
    private final ProductRepository products;
    private final UserRepository users;
    private final CategoryRepository categories;

    @Transactional(readOnly = true)
    public DashboardStats dashboard() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("totalOrders", orders.count());
        counts.put("todayOrders", orders.countByPlacedAtAfter(startOfToday()));
        counts.put("pendingPaymentOrders", orders.countByStatusIn(List.of("PENDING_PAYMENT", "PAYMENT_FAILED")));
        counts.put("pendingOrders", orders.countByStatusIn(List.of("PLACED", "CONFIRMED")));
        counts.put("processingOrders", orders.countByStatus("PROCESSING"));
        counts.put("packedOrders", orders.countByStatus("PACKED"));
        counts.put("shippedOrders", orders.countByStatusIn(List.of("SHIPPED", "IN_TRANSIT")));
        counts.put("outForDeliveryOrders", orders.countByStatus("OUT_FOR_DELIVERY"));
        counts.put("deliveredOrders", orders.countByStatus("DELIVERED"));
        counts.put("cancelRequests", orders.countByStatus("CANCEL_REQUESTED"));
        counts.put("cancelledOrders", orders.countByStatus("CANCELLED"));
        counts.put("openReturns", returns.countByStatus("REQUESTED") + returns.countByStatus("APPROVED")
                + returns.countByStatus("PICKUP_SCHEDULED") + returns.countByStatus("PICKED_UP")
                + returns.countByStatus("RECEIVED") + returns.countByStatus("INSPECTION")
                + returns.countByStatus("APPROVED_FOR_REFUND") + returns.countByStatus("REFUND_PROCESSING"));
        counts.put("openRefunds", refunds.countByStatus("PENDING") + refunds.countByStatus("PROCESSING"));
        counts.put("openReplacements", replacements.countByStatusIn(
                List.of("REQUESTED", "APPROVED", "PROCESSING", "SHIPPED")));
        counts.put("customers", users.count());
        counts.put("products", products.countByIsActiveTrueAndDeletedAtIsNull());
        counts.put("lowStockProducts", inventory.countByStatusIn(List.of("LOW_STOCK")));
        counts.put("outOfStockProducts", inventory.countByStatusIn(List.of("OUT_OF_STOCK")));

        Map<String, BigDecimal> currency = new LinkedHashMap<>();
        currency.put("revenue", orders.sumGrandTotalByStatuses(REVENUE_STATUSES));
        currency.put("revenueToday", orders.sumGrandTotalSince(REVENUE_STATUSES, startOfToday()));
        currency.put("revenueWeek", orders.sumGrandTotalSince(REVENUE_STATUSES,
                LocalDate.now().with(java.time.DayOfWeek.MONDAY)
                        .atStartOfDay(ZoneId.systemDefault()).toInstant()));
        currency.put("revenueMonth", orders.sumGrandTotalSince(REVENUE_STATUSES,
                LocalDate.now().withDayOfMonth(1)
                        .atStartOfDay(ZoneId.systemDefault()).toInstant()));
        currency.put("refunds", refunds.sumSuccessful());
        currency.put("capturedPayments", payments.sumSuccessful());

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (String s : ALL_STATUSES)
            byStatus.put(s, orders.countByStatus(s));

        // 14-day series
        Instant since = startOfToday().minus(13, ChronoUnit.DAYS);
        List<Order> recent = orders.findAll().stream()
                .filter(o -> o.getPlacedAt() != null && !o.getPlacedAt().isBefore(since))
                .toList();
        List<DayPoint> revenueByDay = new ArrayList<>();
        List<DayPoint> ordersByDay = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            Instant from = day.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant to = from.plus(1, ChronoUnit.DAYS);
            List<Order> dayOrders = recent.stream()
                    .filter(o -> !o.getPlacedAt().isBefore(from) && o.getPlacedAt().isBefore(to)).toList();
            BigDecimal rev = dayOrders.stream()
                    .filter(o -> REVENUE_STATUSES.contains(o.getStatus()))
                    .map(Order::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            revenueByDay.add(new DayPoint(day.toString(), rev, dayOrders.size()));
            ordersByDay.add(new DayPoint(day.toString(), rev, dayOrders.size()));
        }

        List<NameValue> categoryDist = new ArrayList<>();
        for (Category c : categories.findByIsActiveTrueOrderBySortOrderAsc())
            categoryDist.add(new NameValue(c.getName(),
                    products.findByCategoryIdAndIsActiveTrueAndDeletedAtIsNullOrderByNameAsc(c.getId()).size()));

        List<NameValue> payMethods = payments.methodDistribution().stream()
                .map(r -> new NameValue(String.valueOf(r[0]), ((Number) r[1]).longValue())).toList();

        Map<String, Long> invStatus = new LinkedHashMap<>();
        for (String s : List.of("IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"))
            invStatus.put(s, inventory.countByStatusIn(List.of(s)));
        List<NameValue> invDist = invStatus.entrySet().stream()
                .map(e -> new NameValue(e.getKey(), e.getValue())).toList();

        List<TopProduct> top = orderItems.bestSellers(org.springframework.data.domain.PageRequest.of(0, 8))
                .stream().map(r -> {
                    String pid = String.valueOf(r[0]);
                    long units = ((Number) r[1]).longValue();
                    String name = products.findById(pid).map(p -> p.getName()).orElse(pid);
                    return new TopProduct(pid, name, units, BigDecimal.ZERO);
                }).toList();

        return new DashboardStats(counts, currency, byStatus, revenueByDay, ordersByDay,
                categoryDist, payMethods, invDist, top);
    }

    @Transactional(readOnly = true)
    public List<SalesReportRow> salesReport(int days) {
        Instant since = LocalDate.now().minusDays(Math.min(Math.max(days, 1), 365))
                .atStartOfDay(ZoneId.systemDefault()).toInstant();
        List<Order> all = orders.findAll().stream()
                .filter(o -> o.getPlacedAt() != null && !o.getPlacedAt().isBefore(since)).toList();
        Map<LocalDate, List<Order>> byDay = new TreeMap<>();
        for (Order o : all)
            byDay.computeIfAbsent(o.getPlacedAt().atZone(ZoneId.systemDefault()).toLocalDate(),
                    k -> new ArrayList<>()).add(o);
        List<SalesReportRow> rows = new ArrayList<>();
        byDay.forEach((day, list) -> {
            BigDecimal rev = list.stream().filter(o -> REVENUE_STATUSES.contains(o.getStatus()))
                    .map(Order::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            rows.add(new SalesReportRow(day.toString(), list.size(), rev, BigDecimal.ZERO));
        });
        return rows;
    }

    private Instant startOfToday() {
        return LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
    }
}
