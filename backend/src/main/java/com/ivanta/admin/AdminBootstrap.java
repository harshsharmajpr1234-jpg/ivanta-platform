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
 * Flyphones Admin Bootstrap:
 * Configures Super Admin and departmental role accounts branded for Flyphones.
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
        String rootEmail = props.getSecurity().getBootstrapAdminEmail();
        String rootPassword = props.getSecurity().getBootstrapAdminPassword();
        if (rootEmail != null && !rootEmail.isBlank() && rootPassword != null && !rootPassword.isBlank()) {
            upsertAdmin(rootEmail.trim().toLowerCase(), rootPassword, props.getSecurity().getBootstrapAdminName(),
                    "SUPER_ADMIN", false, false);
            log.info("Bootstrapped primary SUPER_ADMIN: {}", rootEmail);
        }

        if (props.getSecurity().isDevSeedDemoAdmins()) {
            // Flyphones branded demo accounts
            upsertAdmin("admin@flyphones.in", "Flyphones@Admin123", "Flyphones Admin", "SUPER_ADMIN", false, false);
            upsertAdmin("delivery@flyphones.in", "Flyphones@Delivery123", "Ananya Rao", "DELIVERY_MANAGER", false, false);
            upsertAdmin("orders@flyphones.in", "Flyphones@Orders123", "Sneha Kulkarni", "ORDER_MANAGER", false, false);
            upsertAdmin("inventory@flyphones.in", "Flyphones@Inventory123", "Rohan Mehta", "INVENTORY_MANAGER", false, false);
            upsertAdmin("products@flyphones.in", "Flyphones@Products123", "Priya Nair", "PRODUCT_MANAGER", false, false);
            upsertAdmin("support@flyphones.in", "Flyphones@Support123", "Vikram Joshi", "CUSTOMER_SUPPORT", false, false);
            upsertAdmin("finance@flyphones.in", "Flyphones@Finance123", "Kabir Singh", "FINANCE_MANAGER", false, false);
            upsertAdmin("marketing@flyphones.in", "Flyphones@Marketing123", "Isha Gupta", "MARKETING_MANAGER", false, false);

            // Backward-compatibility aliases
            upsertAdmin("admin@ivanta.in", "Flyphones@Admin123", "Flyphones Admin", "SUPER_ADMIN", false, false);
            upsertAdmin("delivery@ivanta.in", "Flyphones@Delivery123", "Ananya Rao", "DELIVERY_MANAGER", false, false);

            log.info("[BOOTSTRAP] Seeded and synced Flyphones admin & delivery accounts.");
        }
    }

    private void upsertAdmin(String email, String password, String name, String role,
                             boolean twoFactor, boolean mustChange) {
        String cleanEmail = email.trim().toLowerCase();
        AdminUser a = admins.findByEmailIgnoreCase(cleanEmail).orElseGet(() -> {
            AdminUser nw = new AdminUser();
            nw.setId(ids.next("admin_users", "ADM", 4));
            return nw;
        });
        a.setEmail(cleanEmail);
        a.setName(name);
        a.setPasswordHash(encoder.encode(password));
        a.setRole(role);
        a.setTwoFactorEnabled(twoFactor);
        a.setMustChangePassword(mustChange);
        a.setIsActive(true);
        a.setFailedAttempts(0);
        a.setLockedUntil(null);
        admins.save(a);
    }
}
