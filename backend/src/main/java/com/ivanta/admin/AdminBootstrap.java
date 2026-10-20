package com.ivanta.admin;

import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Secure first-SUPER_ADMIN bootstrap (§36): NO admin credentials live in code or SQL.
 * The initial account is created at startup from ADMIN_ROOT_EMAIL / ADMIN_ROOT_PASSWORD
 * env vars ONLY when no admin exists yet. DEV_SEED_DEMO_ADMINS=true additionally seeds
 * the five documented demo role accounts (development only; passwords in docs/authentication.md).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private final AdminUserRepository admins;
    private final PasswordEncoder encoder;
    private final IvantaProperties props;
    private final IdService ids;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (admins.count() == 0) {
            String email = props.getSecurity().getBootstrapAdminEmail();
            String password = props.getSecurity().getBootstrapAdminPassword();
            if (email != null && !email.isBlank() && password != null && !password.isBlank()) {
                create(email.trim().toLowerCase(), password, props.getSecurity().getBootstrapAdminName(),
                        "SUPER_ADMIN", false, true);
                log.info("Bootstrapped first SUPER_ADMIN from environment: {}", email);
            } else {
                log.warn("No admin users exist and IVANTA_INITIAL_ADMIN_EMAIL/IVANTA_INITIAL_ADMIN_PASSWORD are not set. "
                        + "Set them in environment secrets and restart, then UNSET them after first login.");
            }
        }
        if (props.getSecurity().isDevSeedDemoAdmins()) {
            seedIfAbsent("admin@ivanta.in", "Admin@12345", "Aarav Sharma", "SUPER_ADMIN", true, true);
            seedIfAbsent("products@ivanta.in", "Products@123", "Priya Nair", "PRODUCT_MANAGER", false, false);
            seedIfAbsent("inventory@ivanta.in", "Inventory@123", "Rohan Mehta", "INVENTORY_MANAGER", false, false);
            seedIfAbsent("orders@ivanta.in", "Orders@123", "Sneha Kulkarni", "ORDER_MANAGER", false, false);
            seedIfAbsent("finance@ivanta.in", "Finance@123", "Kabir Singh", "FINANCE_MANAGER", false, false);
            seedIfAbsent("delivery@ivanta.in", "Delivery@123", "Ananya Rao", "DELIVERY_MANAGER", false, false);
            seedIfAbsent("support@ivanta.in", "Support@123", "Vikram Joshi", "CUSTOMER_SUPPORT", false, false);
            seedIfAbsent("marketing@ivanta.in", "Marketing@123", "Isha Gupta", "MARKETING_MANAGER", false, false);
            log.warn("DEV_SEED_DEMO_ADMINS enabled — demo admin accounts created. NEVER enable in production.");
        }
    }

    private void seedIfAbsent(String email, String password, String name, String role,
                              boolean twoFactor, boolean mustChange) {
        if (!admins.existsByEmailIgnoreCase(email)) create(email, password, name, role, twoFactor, mustChange);
    }

    private void create(String email, String rawPassword, String name, String role,
                        boolean twoFactor, boolean mustChange) {
        AdminUser a = new AdminUser();
        a.setId(ids.next("admin_users", "ADM", 4));
        a.setEmail(email);
        a.setName(name);
        a.setPasswordHash(encoder.encode(rawPassword));
        a.setRole(role);
        a.setTwoFactorEnabled(twoFactor);
        a.setMustChangePassword(mustChange);
        admins.save(a);
    }
}
