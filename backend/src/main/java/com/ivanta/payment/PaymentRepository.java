package com.ivanta.payment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findFirstByOrderIdOrderByIdDesc(String orderId);
    List<Payment> findByOrderId(String orderId);
    Optional<Payment> findByIdAndUserId(String id, String userId);
    Optional<Payment> findByProviderTransactionId(String providerTransactionId);
    Optional<Payment> findByProviderOrderId(String providerOrderId);
    Optional<Payment> findByProviderPaymentId(String providerPaymentId);
    List<Payment> findByUserIdOrderByIdDesc(String userId);
    Page<Payment> findAllByOrderByIdDesc(Pageable page);
    Page<Payment> findByStatusOrderByIdDesc(String status, Pageable page);
    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal sumSuccessful();

    @Query("SELECT p.method, COUNT(p) FROM Payment p WHERE p.status = 'SUCCESS' GROUP BY p.method")
    List<Object[]> methodDistribution();
}
