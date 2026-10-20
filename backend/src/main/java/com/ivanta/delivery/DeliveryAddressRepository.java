package com.ivanta.delivery;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DeliveryAddressRepository extends JpaRepository<DeliveryAddress, String> {
    Optional<DeliveryAddress> findByOrderId(String orderId);
}
