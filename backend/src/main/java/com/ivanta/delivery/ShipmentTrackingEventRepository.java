package com.ivanta.delivery;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShipmentTrackingEventRepository extends JpaRepository<ShipmentTrackingEvent, Long> {
    List<ShipmentTrackingEvent> findByShipmentIdOrderByIdAsc(String shipmentId);
}
