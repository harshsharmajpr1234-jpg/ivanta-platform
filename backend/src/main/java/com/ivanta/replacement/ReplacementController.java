package com.ivanta.replacement;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.ReplacementDtos.*;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Customer replacement endpoints (§21) — own orders only. */
@RestController
@RequestMapping("/api/v1/replacements")
@RequiredArgsConstructor
public class ReplacementController {

    private final ReplacementService service;

    @PostMapping
    public ApiResponse<ReplacementView> request(@AuthenticationPrincipal CustomerPrincipal me,
                                                @Valid @RequestBody ReplacementCreateRequest req) {
        return ApiResponse.ok(service.request(me.userId(), req));
    }

    @GetMapping
    public ApiResponse<List<ReplacementView>> list(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.listForUser(me.userId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReplacementView> get(@AuthenticationPrincipal CustomerPrincipal me,
                                            @PathVariable String id) {
        return ApiResponse.ok(service.getForUser(me.userId(), id));
    }
}
