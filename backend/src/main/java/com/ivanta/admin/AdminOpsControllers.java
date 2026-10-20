package com.ivanta.admin;

import com.ivanta.audit.AuditLog;
import com.ivanta.audit.AuditLogRepository;
import com.ivanta.audit.AuditService;
import com.ivanta.auth.User;
import com.ivanta.auth.UserRepository;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.delivery.DeliveryService;
import com.ivanta.delivery.Shipment;
import com.ivanta.dto.AdminOpsDtos.*;
import com.ivanta.dto.DeliveryDtos.*;
import com.ivanta.dto.OrderDtos.*;
import com.ivanta.dto.PaymentDtos.*;
import com.ivanta.dto.ProductDtos.PageResponse;
import com.ivanta.dto.ReplacementDtos.*;
import com.ivanta.dto.ReturnDtos.*;
import com.ivanta.dto.ReviewDtos.*;
import com.ivanta.invoice.InvoiceService;
import com.ivanta.order.OrderService;
import com.ivanta.replacement.ReplacementService;
import com.ivanta.payment.Payment;
import com.ivanta.payment.PaymentService;
import com.ivanta.review.ProductReview;
import com.ivanta.review.ReviewService;
import com.ivanta.returnrefund.ReturnService;
import com.ivanta.security.AdminPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin console endpoints (§34). Each action is permission-gated server-side;
 * hiding UI elements is never the security boundary (§36).
 */
public final class AdminOpsControllers {
    private AdminOpsControllers() { }

    /* ---------------- Orders ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/orders")
    @RequiredArgsConstructor
    static class AdminOrderController {

        private final OrderService orders;
        private final InvoiceService invoices;
        private final DeliveryService delivery;

        /** Search by order id/number, customer name/email/phone, product name/SKU, tracking number (§25). */
        @GetMapping
        @PreAuthorize("hasAuthority('ORDER_VIEW')")
        public ApiResponse<PageResponse<OrderSummary>> list(@RequestParam(required = false) String q,
                                                            @RequestParam(required = false) String status,
                                                            @RequestParam(required = false) String paymentStatus,
                                                            @RequestParam(required = false) String from,
                                                            @RequestParam(required = false) String to,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "20") int size) {
            return ApiResponse.ok(orders.adminList(q, status, paymentStatus, from, to, page, size));
        }

        @GetMapping("/{id}")
        @PreAuthorize("hasAuthority('ORDER_VIEW')")
        public ApiResponse<OrderDetail> get(@PathVariable String id) {
            return ApiResponse.ok(orders.adminGet(id));
        }

        @GetMapping("/{id}/timeline")
        @PreAuthorize("hasAuthority('ORDER_VIEW')")
        public ApiResponse<List<TimelineEvent>> timeline(@PathVariable String id) {
            return ApiResponse.ok(orders.timelineForAdmin(id));
        }

        @PostMapping("/{id}/notes")
        @PreAuthorize("hasAuthority('ORDER_UPDATE')")
        public ApiResponse<List<NoteView>> addNote(@PathVariable String id,
                                                   @Valid @RequestBody NoteRequest req,
                                                   AdminPrincipal admin) {
            return ApiResponse.ok(orders.addNote(id, req.note(), admin.adminId()));
        }

        @GetMapping("/{id}/invoice")
        @PreAuthorize("hasAuthority('ORDER_VIEW')")
        public ResponseEntity<byte[]> invoice(@PathVariable String id, AdminPrincipal admin) {
            OrderDetail detail = orders.adminGet(id);
            InvoiceService.InvoicePdf pdf = invoices.getOrGenerate(detail.id(), admin.adminId());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdf.fileName() + "\"")
                    .body(pdf.pdf());
        }

        @RequestMapping(value = "/{id}/status", method = {RequestMethod.POST, RequestMethod.PATCH})
        @PreAuthorize("hasAuthority('ORDER_UPDATE')")
        public ApiResponse<OrderDetail> updateStatus(@PathVariable String id,
                                                     @Valid @RequestBody StatusUpdateRequest req,
                                                     AdminPrincipal admin) {
            return ApiResponse.ok(orders.adminUpdateStatus(id, req.status(), req.reason(), admin.adminId()));
        }

        /** PATCH /admin/orders/{id}/tracking — shipment event alias (§31). */
        @PatchMapping("/{id}/tracking")
        @PreAuthorize("hasAuthority('DELIVERY_UPDATE')")
        public ApiResponse<ShipmentView> tracking(@PathVariable String id,
                                                  @Valid @RequestBody EventRequest req,
                                                  AdminPrincipal admin) {
            return ApiResponse.ok(delivery.addEventForOrder(id, req, admin.adminId()));
        }

        @PostMapping("/{id}/cancel")
        @PreAuthorize("hasAuthority('ORDER_CANCEL')")
        public ApiResponse<OrderDetail> cancel(@PathVariable String id,
                                               @RequestBody(required = false) CancelRequest req,
                                               AdminPrincipal admin) {
            return ApiResponse.ok(orders.cancelByAdmin(id, req == null ? null : req.reason(), admin.adminId()));
        }
    }

    /* ---------------- Replacements (§21) ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/replacements")
    @RequiredArgsConstructor
    static class AdminReplacementController {

        private final ReplacementService replacements;

        @GetMapping
        @PreAuthorize("hasAuthority('ORDER_VIEW')")
        public ApiResponse<List<ReplacementView>> list(@RequestParam(required = false) String status,
                                                       @RequestParam(defaultValue = "50") int limit) {
            return ApiResponse.ok(replacements.adminList(status, limit));
        }

        @GetMapping("/{id}")
        @PreAuthorize("hasAuthority('ORDER_VIEW')")
        public ApiResponse<ReplacementView> get(@PathVariable String id) {
            return ApiResponse.ok(replacements.adminList(null, 200).stream()
                    .filter(r -> r.id().equals(id)).findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Replacement " + id)));
        }

        @PostMapping("/{id}/status")
        @PreAuthorize("hasAuthority('ORDER_UPDATE')")
        public ApiResponse<ReplacementView> update(@PathVariable String id,
                                                   @Valid @RequestBody ReplacementStatusUpdate req,
                                                   AdminPrincipal admin) {
            return ApiResponse.ok(replacements.updateStatus(id, req, admin.adminId()));
        }
    }

    /* ---------------- Payments ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/payments")
    @RequiredArgsConstructor
    static class AdminPaymentController {

        private final PaymentService payments;
        private final UserRepository users;

        @GetMapping
        @PreAuthorize("hasAuthority('PAYMENT_VIEW')")
        public ApiResponse<PageResponse<AdminPaymentRow>> list(@RequestParam(required = false) String status,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
            Page<Payment> p = payments.adminPage(status, page, size);
            List<AdminPaymentRow> rows = p.getContent().stream().map(x -> new AdminPaymentRow(
                    x.getId(), x.getOrderId(), x.getUserId(),
                    users.findById(x.getUserId()).map(User::getName).orElse(null),
                    x.getAmount(), x.getCurrency(), x.getMethod(), x.getStatus(),
                    x.getProviderOrderId(), x.getProviderPaymentId(), x.getFailureReason(),
                    x.getCreatedAt() == null ? null : x.getCreatedAt().toString())).toList();
            return ApiResponse.ok(new PageResponse<>(rows, p.getNumber(), p.getSize(),
                    p.getTotalElements(), p.getTotalPages()));
        }

        @GetMapping("/{id}/transactions")
        @PreAuthorize("hasAuthority('PAYMENT_VIEW')")
        public ApiResponse<List<TransactionView>> transactions(@PathVariable String id) {
            return ApiResponse.ok(payments.transactionsFor(id));
        }

        @PostMapping("/{id}/cod-collected")
        @PreAuthorize("hasAuthority('PAYMENT_VIEW')")
        public ApiResponse<PaymentView> codCollected(@PathVariable String id, AdminPrincipal admin) {
            return ApiResponse.ok(payments.confirmCodCollected(id, admin.adminId()));
        }
    }

    /* ---------------- Delivery ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/delivery")
    @RequiredArgsConstructor
    static class AdminDeliveryController {

        private final DeliveryService delivery;

        @GetMapping("/shipments")
        @PreAuthorize("hasAuthority('DELIVERY_VIEW')")
        public ApiResponse<PageResponse<ShipmentView>> shipments(@RequestParam(required = false) String status,
                                                                 @RequestParam(required = false) String orderId,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "20") int size) {
            Page<Shipment> p = delivery.adminShipments(status, orderId, page, size);
            List<ShipmentView> rows = p.getContent().stream().map(delivery::toView).toList();
            return ApiResponse.ok(new PageResponse<>(rows, p.getNumber(), p.getSize(),
                    p.getTotalElements(), p.getTotalPages()));
        }

        @PostMapping("/orders/{orderId}/ship")
        @PreAuthorize("hasAuthority('DELIVERY_UPDATE')")
        public ApiResponse<ShipmentView> ship(@PathVariable String orderId,
                                              @RequestBody(required = false) ShipRequest req,
                                              AdminPrincipal admin) {
            return ApiResponse.ok(delivery.shipOrder(orderId, req, admin.adminId()));
        }

        @PostMapping("/shipments/{id}/events")
        @PreAuthorize("hasAuthority('DELIVERY_UPDATE')")
        public ApiResponse<ShipmentView> event(@PathVariable String id,
                                               @Valid @RequestBody EventRequest req,
                                               AdminPrincipal admin) {
            return ApiResponse.ok(delivery.addEvent(id, req, admin.adminId()));
        }

        @GetMapping("/shipping-methods")
        @PreAuthorize("hasAuthority('DELIVERY_VIEW')")
        public ApiResponse<List<com.ivanta.delivery.ShippingMethod>> methods() {
            return ApiResponse.ok(delivery.listMethods());
        }

        @PostMapping("/shipping-methods")
        @PreAuthorize("hasAuthority('DELIVERY_UPDATE')")
        public ApiResponse<com.ivanta.delivery.ShippingMethod> createMethod(@Valid @RequestBody ShippingMethodUpsert req) {
            return ApiResponse.ok(delivery.upsertMethod(null, req));
        }

        @PatchMapping("/shipping-methods/{id}")
        @PreAuthorize("hasAuthority('DELIVERY_UPDATE')")
        public ApiResponse<com.ivanta.delivery.ShippingMethod> updateMethod(@PathVariable String id,
                                                                            @RequestBody ShippingMethodUpsert req) {
            return ApiResponse.ok(delivery.upsertMethod(id, req));
        }

        @GetMapping("/warehouse")
        @PreAuthorize("hasAuthority('DELIVERY_VIEW')")
        public ApiResponse<WarehouseSettingsView> warehouse() {
            return ApiResponse.ok(delivery.getWarehouseSettings());
        }

        @PutMapping("/warehouse")
        @PreAuthorize("hasAuthority('DELIVERY_UPDATE')")
        public ApiResponse<WarehouseSettingsView> updateWarehouse(@Valid @RequestBody WarehouseSettingsUpsert req, AdminPrincipal admin) {
            return ApiResponse.ok(delivery.updateWarehouseSettings(req, admin.adminId()));
        }

        @GetMapping("/provider-status")
        @PreAuthorize("hasAuthority('DELIVERY_VIEW')")
        public ApiResponse<CourierProviderStatusView> providerStatus() {
            return ApiResponse.ok(delivery.getProviderStatus());
        }
    }

    /* ---------------- Returns & refunds ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin")
    @RequiredArgsConstructor
    static class AdminReturnController {

        private final ReturnService returns;

        @GetMapping("/returns")
        @PreAuthorize("hasAuthority('ORDER_VIEW')")
        public ApiResponse<List<ReturnView>> list(@RequestParam(required = false) String status,
                                                  @RequestParam(required = false) String orderId,
                                                  @RequestParam(defaultValue = "50") int limit) {
            return ApiResponse.ok(returns.adminList(status, orderId, limit));
        }

        @PostMapping("/returns/{id}/status")
        @PreAuthorize("hasAuthority('ORDER_UPDATE')")
        public ApiResponse<ReturnView> update(@PathVariable String id,
                                              @Valid @RequestBody ReturnStatusUpdate req,
                                              AdminPrincipal admin) {
            return ApiResponse.ok(returns.updateStatus(id, req, admin.adminId()));
        }

        @GetMapping("/refunds")
        @PreAuthorize("hasAuthority('PAYMENT_VIEW')")
        public ApiResponse<List<RefundView>> refunds(@RequestParam(required = false) String orderId,
                                                     @RequestParam(defaultValue = "50") int limit) {
            return ApiResponse.ok(returns.adminRefunds(orderId, limit));
        }
    }

    /* ---------------- Reviews ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/reviews")
    @RequiredArgsConstructor
    static class AdminReviewController {

        private final ReviewService reviews;

        @GetMapping
        @PreAuthorize("hasAuthority('REVIEW_MODERATE')")
        public ApiResponse<PageResponse<ReviewView>> list(@RequestParam(required = false) String status,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
            Page<ProductReview> p = reviews.adminList(status, page, size);
            List<ReviewView> rows = p.getContent().stream().map(reviews::toView).toList();
            return ApiResponse.ok(new PageResponse<>(rows, p.getNumber(), p.getSize(),
                    p.getTotalElements(), p.getTotalPages()));
        }

        @PostMapping("/{id}/moderate")
        @PreAuthorize("hasAuthority('REVIEW_MODERATE')")
        public ApiResponse<ReviewView> moderate(@PathVariable String id,
                                                @Valid @RequestBody ModerateRequest req,
                                                AdminPrincipal admin) {
            return ApiResponse.ok(reviews.moderate(id, req, admin.adminId()));
        }
    }

    /* ---------------- Customers ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/customers")
    @RequiredArgsConstructor
    static class AdminCustomerController {

        private final UserRepository users;
        private final com.ivanta.order.OrderRepository orders;
        private final AuditService audit;

        @GetMapping
        @PreAuthorize("hasAuthority('CUSTOMER_VIEW')")
        public ApiResponse<PageResponse<CustomerRow>> list(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "20") int size) {
            Page<User> p = users.findAll(PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100),
                    org.springframework.data.domain.Sort.by("createdAt").descending()));
            List<CustomerRow> rows = new ArrayList<>();
            for (User u : p.getContent()) {
                if (u.getDeletedAt() != null) continue;
                rows.add(new CustomerRow(u.getId(), u.getName(), u.getEmail(), u.getPhone(),
                        Boolean.TRUE.equals(u.getIsActive()),
                        u.getCreatedAt() == null ? null : u.getCreatedAt().toString(),
                        orders.countByUserId(u.getId()), orders.sumGrandTotalForUser(u.getId())));
            }
            return ApiResponse.ok(new PageResponse<>(rows, p.getNumber(), p.getSize(),
                    p.getTotalElements(), p.getTotalPages()));
        }

        @PatchMapping("/{id}")
        @PreAuthorize("hasAuthority('CUSTOMER_UPDATE')")
        public ApiResponse<Void> update(@PathVariable String id, @RequestBody Map<String, Object> body,
                                        AdminPrincipal admin) {
            User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer " + id));
            String before = "active=" + u.getIsActive() + " name=" + u.getName();
            if (body.get("isActive") instanceof Boolean active) {
                u.setIsActive(active);
                if (!active) { u.setDeletedAt(Instant.now()); u.setDeletedBy(admin.adminId()); }
                else u.setDeletedAt(null);
            }
            if (body.get("name") instanceof String name && !name.isBlank()) u.setName(name.trim());
            users.save(u);
            audit.record("CUSTOMER_UPDATED", "user", id, before,
                    "active=" + u.getIsActive() + " name=" + u.getName());
            return ApiResponse.ok();
        }
    }

    /* ---------------- Dashboard / reports ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin")
    @RequiredArgsConstructor
    static class AdminStatsController {

        private final AdminStatsService stats;

        @GetMapping("/stats")
        @PreAuthorize("hasAuthority('REPORT_VIEW')")
        public ApiResponse<DashboardStats> dashboard() {
            return ApiResponse.ok(stats.dashboard());
        }

        @GetMapping("/reports/sales")
        @PreAuthorize("hasAuthority('REPORT_VIEW')")
        public ApiResponse<List<SalesReportRow>> sales(@RequestParam(defaultValue = "30") int days) {
            return ApiResponse.ok(stats.salesReport(days));
        }
    }

    /* ---------------- Settings ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/settings")
    @RequiredArgsConstructor
    static class AdminSettingsController {

        private final SystemSettingRepository settings;
        private final AuditService audit;

        @GetMapping
        @PreAuthorize("hasAuthority('ADMIN')")
        public ApiResponse<List<SettingView>> list() {
            return ApiResponse.ok(settings.findAllByOrderByCategoryAscSettingKeyAsc().stream()
                    .map(s -> new SettingView(s.getSettingKey(), s.getSettingValue(), s.getCategory(),
                            s.getDescription(), s.getUpdatedAt() == null ? null : s.getUpdatedAt().toString()))
                    .toList());
        }

        @PatchMapping("/{key}")
        @PreAuthorize("hasAuthority('SETTINGS_UPDATE')")
        public ApiResponse<SettingView> update(@PathVariable String key, @RequestBody SettingUpdate req,
                                               AdminPrincipal admin) {
            SystemSetting s = settings.findById(key)
                    .orElseThrow(() -> new ResourceNotFoundException("Setting " + key));
            String before = s.getSettingValue();
            s.setSettingValue(req.value());
            s.setUpdatedBy(admin.adminId());
            settings.save(s);
            audit.record("SETTINGS_UPDATED", "system_setting", key, before, req.value());
            return ApiResponse.ok(new SettingView(s.getSettingKey(), s.getSettingValue(), s.getCategory(),
                    s.getDescription(), Instant.now().toString()));
        }
    }

    /* ---------------- Audit logs ---------------- */

    @RestController
    @RequestMapping("/api/v1/admin/audit-logs")
    @RequiredArgsConstructor
    static class AdminAuditController {

        private final AuditLogRepository logs;

        @GetMapping
        @PreAuthorize("hasAuthority('AUDIT_VIEW')")
        public ApiResponse<PageResponse<AuditLogView>> list(@RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "30") int size,
                                                            @RequestParam(required = false) String entityType,
                                                            @RequestParam(required = false) String entityId) {
            PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
            Page<AuditLog> p = (entityType != null && entityId != null)
                    ? logs.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pr)
                    : logs.findAllByOrderByCreatedAtDesc(pr);
            List<AuditLogView> rows = p.getContent().stream()
                    .map(l -> new AuditLogView(l.getId(), l.getActorType().name(), l.getActorName(),
                            l.getActorRole(), l.getAction(), l.getEntityType(), l.getEntityId(),
                            l.getOldValue(), l.getNewValue(), l.getIpAddress(),
                            l.getCreatedAt().toString()))
                    .toList();
            return ApiResponse.ok(new PageResponse<>(rows, p.getNumber(), p.getSize(),
                    p.getTotalElements(), p.getTotalPages()));
        }
    }
}
