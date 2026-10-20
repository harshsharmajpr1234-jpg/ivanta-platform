package com.ivanta.payment;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.PaymentDtos.*;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Customer payment endpoints (§25). */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;

    @PostMapping({"/initiate", "/create"})
    public ApiResponse<PaymentView> initiate(@AuthenticationPrincipal CustomerPrincipal me,
                                             @Valid @RequestBody InitiateRequest req) {
        return ApiResponse.ok(service.initiate(me.userId(), req));
    }

    @PostMapping("/{id}/verify")
    public ApiResponse<PaymentView> verify(@AuthenticationPrincipal CustomerPrincipal me,
                                           @PathVariable String id,
                                           @Valid @RequestBody VerifyRequest req) {
        return ApiResponse.ok(service.verify(me.userId(), id, req));
    }

    /** Body-based alias: POST /payments/verify {paymentId, reference} (§31). */
    public record BodyVerifyRequest(@NotBlank String paymentId, @NotBlank String reference) { }

    @PostMapping("/verify")
    public ApiResponse<PaymentView> verifyByBody(@AuthenticationPrincipal CustomerPrincipal me,
                                                 @Valid @RequestBody BodyVerifyRequest req) {
        return ApiResponse.ok(service.verify(me.userId(), req.paymentId(), new VerifyRequest(req.reference())));
    }

    @GetMapping
    public ApiResponse<List<PaymentView>> list(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.listForUser(me.userId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentView> get(@AuthenticationPrincipal CustomerPrincipal me, @PathVariable String id) {
        return ApiResponse.ok(service.getForUser(me.userId(), id));
    }
}
