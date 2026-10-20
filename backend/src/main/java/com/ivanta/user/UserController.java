package com.ivanta.user;

import com.ivanta.auth.CustomerAuthService;
import com.ivanta.auth.CustomerProfile;
import com.ivanta.auth.CustomerProfileRepository;
import com.ivanta.auth.UserRepository;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.AuthDtos.UserResponse;
import com.ivanta.dto.UserDtos.*;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Customer account (§40): profile + addresses. */
@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository users;
    private final CustomerProfileRepository profiles;
    private final AddressService addresses;
    private final CustomerAuthService auth;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> profile(@AuthenticationPrincipal CustomerPrincipal me) {
        var u = users.findById(me.userId()).orElseThrow();
        CustomerProfile p = profiles.findById(me.userId()).orElse(null);
        return ApiResponse.ok(Map.of(
                "user", auth.toDto(u),
                "marketingEmails", p == null || Boolean.TRUE.equals(p.getMarketingEmails()),
                "marketingSms", p != null && Boolean.TRUE.equals(p.getMarketingSms())));
    }

    @PatchMapping
    @Transactional
    public ApiResponse<UserResponse> update(@AuthenticationPrincipal CustomerPrincipal me,
                                            @Valid @RequestBody ProfileUpdate req) {
        var u = users.findById(me.userId()).orElseThrow();
        if (req.name() != null && !req.name().isBlank()) u.setName(req.name().trim());
        users.save(u);
        CustomerProfile p = profiles.findById(me.userId()).orElseGet(() -> {
            CustomerProfile n = new CustomerProfile();
            n.setUserId(me.userId());
            return n;
        });
        if (req.marketingEmails() != null) p.setMarketingEmails(req.marketingEmails());
        if (req.marketingSms() != null) p.setMarketingSms(req.marketingSms());
        profiles.save(p);
        return ApiResponse.ok(CustomerAuthService.toDto(u));
    }

    @GetMapping("/addresses")
    public ApiResponse<List<AddressView>> addresses(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(addresses.list(me.userId()));
    }

    @PostMapping("/addresses")
    public ApiResponse<AddressView> createAddress(@AuthenticationPrincipal CustomerPrincipal me,
                                                  @Valid @RequestBody AddressRequest req) {
        return ApiResponse.ok(addresses.create(me.userId(), req));
    }

    @PatchMapping("/addresses/{id}")
    public ApiResponse<AddressView> updateAddress(@AuthenticationPrincipal CustomerPrincipal me,
                                                  @PathVariable String id,
                                                  @Valid @RequestBody AddressRequest req) {
        return ApiResponse.ok(addresses.update(me.userId(), id, req));
    }

    @DeleteMapping("/addresses/{id}")
    public ApiResponse<Void> deleteAddress(@AuthenticationPrincipal CustomerPrincipal me, @PathVariable String id) {
        addresses.delete(me.userId(), id);
        return ApiResponse.ok();
    }

    @PostMapping("/addresses/{id}/default")
    public ApiResponse<AddressView> setDefault(@AuthenticationPrincipal CustomerPrincipal me, @PathVariable String id) {
        return ApiResponse.ok(addresses.setDefault(me.userId(), id));
    }
}
