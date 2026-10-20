package com.ivanta.security;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolves role -> permission sets from the RBAC tables (V2 migration).
 * Cached in-memory; invalidated when SUPER_ADMIN edits role permissions.
 * SUPER_ADMIN is additionally treated as a wildcard in AdminPrincipal.can().
 */
@Service
@RequiredArgsConstructor
public class PermissionResolver {

    private final JdbcTemplate jdbc;
    private final Map<String, Set<String>> cache = new ConcurrentHashMap<>();

    public Set<String> permissionsFor(String role) {
        return cache.computeIfAbsent(role, r -> {
            List<String> perms = jdbc.queryForList(
                    "SELECT permission FROM role_permissions WHERE role = ?", String.class, r);
            return new HashSet<>(perms);
        });
    }

    public List<String> allPermissions() {
        return jdbc.queryForList("SELECT permission FROM permissions ORDER BY permission", String.class);
    }

    public void evict() { cache.clear(); }
}
