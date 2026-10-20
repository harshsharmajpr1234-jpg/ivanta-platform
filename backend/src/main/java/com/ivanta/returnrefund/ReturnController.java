package com.ivanta.returnrefund;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.ReturnDtos.*;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Customer returns & refunds (§30/§31). */
@RestController
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService service;

    @PostMapping("/api/v1/returns")
    public ApiResponse<ReturnView> request(@AuthenticationPrincipal CustomerPrincipal me,
                                           @Valid @RequestBody ReturnCreateRequest req) {
        return ApiResponse.ok(service.request(me.userId(), req));
    }

    @GetMapping("/api/v1/returns")
    public ApiResponse<List<ReturnView>> list(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.listForUser(me.userId()));
    }

    @GetMapping("/api/v1/returns/{id}")
    public ApiResponse<ReturnView> get(@AuthenticationPrincipal CustomerPrincipal me, @PathVariable String id) {
        return ApiResponse.ok(service.getForUser(me.userId(), id));
    }

    @GetMapping("/api/v1/refunds")
    public ApiResponse<List<RefundView>> refunds(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.refundsForUser(me.userId()));
    }
}
