package com.ivanta.returnrefund;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface RefundRepository extends JpaRepository<Refund, String> {
    List<Refund> findByOrderId(String orderId);
    Page<Refund> findAllByOrderByIdDesc(Pageable page);
    long countByStatus(String status);

    @Query("SELECT r FROM Refund r WHERE r.orderId IN (SELECT o.id FROM com.ivanta.order.Order o WHERE o.userId = ?1) ORDER BY r.id DESC")
    List<Refund> findByUser(String userId);

    @Query("SELECT COALESCE(SUM(r.amount),0) FROM Refund r WHERE r.status = 'SUCCESS'")
    BigDecimal sumSuccessful();
}
