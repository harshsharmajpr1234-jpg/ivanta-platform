package com.ivanta.delivery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourierWebhookRepository extends JpaRepository<CourierWebhook, Long> {
    boolean existsByEventHash(String eventHash);
    Optional<CourierWebhook> findByEventHash(String eventHash);
}
