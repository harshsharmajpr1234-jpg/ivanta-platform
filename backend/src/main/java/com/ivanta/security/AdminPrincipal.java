package com.ivanta.security;

import java.util.Set;

/** Authenticated admin identity with the permission set resolved server-side (§13). */
public record AdminPrincipal(String adminId, String name, String email, String role, Set<String> permissions) {
    public boolean can(String permission) {
        return "SUPER_ADMIN".equals(role) || permissions.contains(permission);
    }
}
