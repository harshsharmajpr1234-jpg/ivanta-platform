package com.ivanta.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Admin console DTOs (§34/§37). */
public final class AdminOpsDtos {
    private AdminOpsDtos() { }

    public record CustomerRow(String id, String name, String email, String phone, boolean isActive,
                              String createdAt, long orderCount, BigDecimal totalSpent) { }

    public record DashboardStats(Map<String, Long> counts, Map<String, BigDecimal> currency,
                                 Map<String, Long> ordersByStatus, List<DayPoint> revenueByDay,
                                 List<DayPoint> ordersByDay, List<NameValue> categoryDistribution,
                                 List<NameValue> paymentMethods, List<NameValue> inventoryStatus,
                                 List<TopProduct> topProducts) { }

    public record DayPoint(String day, BigDecimal revenue, long orders) { }

    public record NameValue(String name, long value) { }

    public record TopProduct(String productId, String name, long unitsSold, BigDecimal revenue) { }

    public record AuditLogView(String id, String actorType, String actorName, String actorRole,
                               String action, String entityType, String entityId,
                               String oldValue, String newValue, String ipAddress, String createdAt) { }

    public record SettingView(String key, String value, String category, String description, String updatedAt) { }

    public record SettingUpdate(String value) { }

    public record SalesReportRow(String day, long orders, BigDecimal revenue, BigDecimal refundTotal) { }
}
