package com.ivanta.inventory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface StockReservationRepository extends JpaRepository<StockReservation, String> {
    List<StockReservation> findByOrderId(String orderId);
    List<StockReservation> findByOrderIdAndStatus(String orderId, StockReservation.Status status);
    List<StockReservation> findByStatusAndExpiresAtBefore(StockReservation.Status status, Instant now);
}
