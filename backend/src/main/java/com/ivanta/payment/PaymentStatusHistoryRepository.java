package com.ivanta.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentStatusHistoryRepository extends JpaRepository<PaymentStatusHistory, Long> {
    List<PaymentStatusHistory> findByPaymentIdOrderByIdAsc(String paymentId);
}
