package com.ivanta.delivery;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, String> {
    Optional<Shipment> findFirstByOrderIdOrderByIdDesc(String orderId);
    List<Shipment> findByOrderId(String orderId);
    Page<Shipment> findAllByOrderByCreatedAtDesc(Pageable page);
    Page<Shipment> findByStatusOrderByCreatedAtDesc(String status, Pageable page);
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
}
