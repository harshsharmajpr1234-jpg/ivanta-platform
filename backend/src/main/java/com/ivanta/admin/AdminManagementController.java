package com.ivanta.admin;

import com.ivanta.admin.dto.AdminDtos.*;
import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.security.AdminPrincipal;
import com.ivanta.security.PermissionResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Admin management (§12): restricted to ADMIN_MANAGE permission which the RBAC
 * matrix grants ONLY to SUPER_ADMIN. Admins can never self-promote.
 */
@RestController
@RequestMapping("/api/v1/admin/admins")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
public class AdminManagementController {

    private static final Set<String> VALID_ROLES = Set.of("SUPER_ADMIN", "PRODUCT_MANAGER",
            "INVENTORY_MANAGER", "ORDER_MANAGER", "FINANCE_MANAGER", "DELIVERY_MANAGER",
            "CUSTOMER_SUPPORT", "MARKETING_MANAGER");

    private final AdminUserRepository admins;
    private final AdminAuthService authService;
    private final PasswordEncoder encoder;
    private final IdService ids;
    private final AuditService audit;
    private final PermissionResolver permissionResolver;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<AdminProfile>> list() {
        return ApiResponse.ok(admins.findAllByOrderByCreatedAtAsc().stream()
                .map(authService::toProfile).toList());
    }

    @GetMapping("/roles")
    public ApiResponse<List<String>> roles() {
        return ApiResponse.ok(VALID_ROLES.stream().sorted().toList());
    }

    @GetMapping("/permissions")
    public ApiResponse<List<String>> permissions() {
        return ApiResponse.ok(permissionResolver.allPermissions());
    }

    @PostMapping
    @Transactional
    public ApiResponse<AdminProfile> create(@Valid @RequestBody CreateAdminRequest req, AdminPrincipal actor) {
        String email = req.email().trim().toLowerCase();
        if (admins.existsByEmailIgnoreCase(email))
            throw new BusinessException(ErrorCode.CONFLICT, "An admin with this email already exists");
        if (!VALID_ROLES.contains(req.role()))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unknown role");
        AdminUser a = new AdminUser();
        a.setId(ids.next("admin_users", "ADM", 4));
        a.setName(req.name().trim());
        a.setEmail(email);
        a.setPasswordHash(encoder.encode(req.tempPassword()));
        a.setRole(req.role());
        a.setMustChangePassword(true);
        admins.save(a);
        audit.record("ADMIN_CREATED", "admin_user", a.getId(), null, email + " role=" + req.role());
        return ApiResponse.ok(authService.toProfile(a));
    }

    @PatchMapping("/{id}")
    @Transactional
    public ApiResponse<AdminProfile> update(@PathVariable String id, @RequestBody UpdateAdminRequest req,
                                            AdminPrincipal actor) {
        AdminUser a = admins.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Admin not found"));
        boolean self = a.getId().equals(actor.adminId());
        String before = "name=" + a.getName() + " role=" + a.getRole() + " active=" + a.getIsActive();
        if (req.name() != null && !req.name().isBlank()) a.setName(req.name().trim());
        if (req.role() != null) {
            if (!VALID_ROLES.contains(req.role())) throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unknown role");
            if (self) throw new BusinessException(ErrorCode.FORBIDDEN, "You cannot change your own role");
            a.setRole(req.role());
        }
        if (req.isActive() != null) {
            if (self && !req.isActive()) throw new BusinessException(ErrorCode.FORBIDDEN, "You cannot disable your own account");
            a.setIsActive(req.isActive());
            a.setDisabledAt(req.isActive() ? null : Instant.now());
            a.setDisabledBy(req.isActive() ? null : actor.adminId());
        }
        admins.save(a);
        String after = "name=" + a.getName() + " role=" + a.getRole() + " active=" + a.getIsActive();
        audit.record("ADMIN_UPDATED", "admin_user", a.getId(), before, after);
        return ApiResponse.ok(authService.toProfile(a));
    }
}
