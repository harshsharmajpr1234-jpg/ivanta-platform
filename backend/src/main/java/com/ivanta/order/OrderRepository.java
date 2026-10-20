package com.ivanta.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(String userId, Pageable page);
    Optional<Order> findByIdAndUserId(String id, String userId);
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByStatus(String status);
    Page<Order> findByStatusOrderByCreatedAtDesc(String status, Pageable page);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable page);
    long countByStatus(String status);
    long countByStatusIn(List<String> statuses);
    long countByPlacedAtAfter(Instant since);
    long countByUserId(String userId);

    @Query("SELECT COALESCE(SUM(o.grandTotal),0) FROM Order o WHERE o.status IN :statuses")
    BigDecimal sumGrandTotalByStatuses(@Param("statuses") List<String> statuses);

    @Query("SELECT COALESCE(SUM(o.grandTotal),0) FROM Order o WHERE o.status IN :statuses AND o.placedAt >= :since")
    BigDecimal sumGrandTotalSince(@Param("statuses") List<String> statuses, @Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(o.grandTotal),0) FROM Order o WHERE o.userId = :userId AND o.status <> 'CANCELLED'")
    BigDecimal sumGrandTotalForUser(@Param("userId") String userId);

    /**
     * Customer order search (§25): by order id / order number / product name / SKU,
     * with status and placed-date range filters. Server-side pagination — the full
     * order book is never sent to the browser.
     */
    @Query("""
            SELECT o FROM Order o
            WHERE o.userId = :userId
              AND (:status IS NULL OR o.status = :status)
              AND (:from IS NULL OR o.placedAt >= :from)
              AND (:to IS NULL OR o.placedAt <= :to)
              AND (:q IS NULL
                   OR LOWER(o.id) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR EXISTS (SELECT 1 FROM OrderItem oi WHERE oi.orderId = o.id
                              AND (LOWER(oi.productName) LIKE LOWER(CONCAT('%', :q, '%'))
                                   OR LOWER(oi.sku) LIKE LOWER(CONCAT('%', :q, '%')))))
            """)
    Page<Order> searchForUser(@Param("userId") String userId,
                              @Param("q") String q,
                              @Param("status") String status,
                              @Param("from") Instant from,
                              @Param("to") Instant to,
                              Pageable page);

    /**
     * Admin order search (§25): order id / order number / customer name / email /
     * phone / product name / SKU / tracking number + status, payment status and
     * date-range filters.
     */
    @Query("""
            SELECT o FROM Order o
            WHERE (:status IS NULL OR o.status = :status)
              AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus)
              AND (:from IS NULL OR o.placedAt >= :from)
              AND (:to IS NULL OR o.placedAt <= :to)
              AND (:q IS NULL
                   OR LOWER(o.id) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR EXISTS (SELECT 1 FROM com.ivanta.auth.User u WHERE u.id = o.userId
                              AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%'))
                                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                                   OR u.phone LIKE CONCAT('%', :q, '%')))
                   OR EXISTS (SELECT 1 FROM OrderItem oi WHERE oi.orderId = o.id
                              AND (LOWER(oi.productName) LIKE LOWER(CONCAT('%', :q, '%'))
                                   OR LOWER(oi.sku) LIKE LOWER(CONCAT('%', :q, '%'))))
                   OR EXISTS (SELECT 1 FROM com.ivanta.delivery.Shipment sh WHERE sh.orderId = o.id
                              AND LOWER(sh.trackingNumber) LIKE LOWER(CONCAT('%', :q, '%'))))
            """)
    Page<Order> searchForAdmin(@Param("q") String q,
                               @Param("status") String status,
                               @Param("paymentStatus") String paymentStatus,
                               @Param("from") Instant from,
                               @Param("to") Instant to,
                               Pageable page);
}
