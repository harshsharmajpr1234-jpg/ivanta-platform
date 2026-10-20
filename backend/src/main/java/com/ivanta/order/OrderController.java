package com.ivanta.order;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.delivery.DeliveryService;
import com.ivanta.dto.DeliveryDtos.TrackingView;
import com.ivanta.dto.OrderDtos.*;
import com.ivanta.dto.ProductDtos.PageResponse;
import com.ivanta.invoice.InvoiceService;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Customer order endpoints (§23/§40): own orders only (IDOR-guarded in the service). */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService service;
    private final DeliveryService delivery;
    private final InvoiceService invoices;

    @PostMapping
    public ApiResponse<OrderDetail> place(@AuthenticationPrincipal CustomerPrincipal me,
                                          @Valid @RequestBody PlaceOrderRequest req) {
        return ApiResponse.ok(service.place(me.userId(), req));
    }

    @GetMapping
    public ApiResponse<PageResponse<OrderSummary>> list(@AuthenticationPrincipal CustomerPrincipal me,
                                                        @RequestParam(required = false) String q,
                                                        @RequestParam(required = false) String status,
                                                        @RequestParam(required = false) String from,
                                                        @RequestParam(required = false) String to,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.listForUser(me.userId(), q, status, from, to, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDetail> get(@AuthenticationPrincipal CustomerPrincipal me, @PathVariable String id) {
        return ApiResponse.ok(service.getForUser(me.userId(), id));
    }

    /** Real timeline (§9): status ledger + payment history + shipment tracking events. */
    @GetMapping("/{id}/timeline")
    public ApiResponse<List<TimelineEvent>> timeline(@AuthenticationPrincipal CustomerPrincipal me,
                                                     @PathVariable String id) {
        return ApiResponse.ok(service.timelineForUser(me.userId(), id));
    }

    /** Shipment tracking (§10/§11). */
    @GetMapping("/{id}/tracking")
    public ApiResponse<TrackingView> tracking(@AuthenticationPrincipal CustomerPrincipal me,
                                              @PathVariable String id) {
        return ApiResponse.ok(delivery.trackingForUser(me.userId(), id));
    }

    /** Backend-generated invoice PDF (§17). */
    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> invoice(@AuthenticationPrincipal CustomerPrincipal me,
                                          @PathVariable String id) {
        OrderDetail detail = service.getForUser(me.userId(), id);   // ownership guard
        InvoiceService.InvoicePdf pdf = invoices.getOrGenerate(detail.id(), me.userId());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + pdf.fileName() + "\"")
                .body(pdf.pdf());
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderDetail> cancel(@AuthenticationPrincipal CustomerPrincipal me,
                                           @PathVariable String id,
                                           @RequestBody(required = false) CancelRequest req) {
        return ApiResponse.ok(service.cancelByCustomer(me.userId(), id, req == null ? null : req.reason()));
    }
}
