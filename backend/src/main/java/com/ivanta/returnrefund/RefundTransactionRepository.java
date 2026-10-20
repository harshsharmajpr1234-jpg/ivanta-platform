package com.ivanta.returnrefund;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RefundTransactionRepository extends JpaRepository<RefundTransaction, String> {
    List<RefundTransaction> findByRefundIdOrderByIdDesc(String refundId);
}
