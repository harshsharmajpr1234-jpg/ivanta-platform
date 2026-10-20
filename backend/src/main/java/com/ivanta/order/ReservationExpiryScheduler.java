package com.ivanta.order;

import com.ivanta.inventory.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Releases expired stock reservations (§14) and cancels the still-unpaid orders
 * that held them — runs every minute.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {

    private final InventoryService inventory;
    private final OrderService orders;

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void releaseExpiredReservations() {
        try {
            Set<String> affected = inventory.expireDueReservations();
            for (String orderId : affected) {
                orders.cancelSystem(orderId, "Stock reservation expired before payment");
                log.info("Expired reservation released; order {} cancelled", orderId);
            }
        } catch (Exception e) {
            log.error("Reservation expiry sweep failed", e);
        }
    }
}
