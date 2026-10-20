package com.ivanta.delivery;

import com.ivanta.delivery.provider.CourierProvider;
import com.ivanta.delivery.provider.CourierProviderFactory;
import com.ivanta.dto.DeliveryDtos.EventRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class TrackingSyncScheduler {

    private static final Set<String> ACTIVE_STATUSES = Set.of("LABEL_CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY");

    private final ShipmentRepository shipments;
    private final DeliveryService delivery;
    private final CourierProviderFactory courierFactory;

    /** Runs every 30 minutes to sync active shipment tracking from courier provider. */
    @Scheduled(fixedDelayString = "${ivanta.delivery.sync-interval-ms:1800000}")
    public void syncActiveShipments() {
        log.info("[TRACKING SCHEDULER] Starting periodic active shipment tracking sync...");
        CourierProvider activeProvider = courierFactory.getActiveProvider();

        List<Shipment> activeList = shipments.findAll().stream()
                .filter(s -> ACTIVE_STATUSES.contains(s.getStatus()) && s.getTrackingNumber() != null && !s.getTrackingNumber().isBlank())
                .toList();

        int synced = 0;
        for (Shipment s : activeList) {
            try {
                CourierProvider.TrackingResult res = activeProvider.fetchTracking(s.getProviderShipmentId(), s.getTrackingNumber());
                if (res.success() && res.status() != null && !res.status().equals(s.getStatus())) {
                    delivery.addEvent(s.getId(), new EventRequest(res.status(), "Scheduled tracking sync via " + activeProvider.getName(), res.currentLocation()), "SCHEDULER");
                    synced++;
                }
            } catch (Exception e) {
                log.warn("[TRACKING SCHEDULER] Failed to sync tracking for shipment {} (AWB {}): {}", s.getId(), s.getTrackingNumber(), e.getMessage());
            }
        }
        log.info("[TRACKING SCHEDULER] Tracking sync finished. Checked {} active shipments, updated {}", activeList.size(), synced);
    }
}
