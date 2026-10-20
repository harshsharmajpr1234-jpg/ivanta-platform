package com.ivanta.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    List<OrderItem> findByOrderId(String orderId);
    long countByProductId(String productId);

    /** Best sellers: [productId, qty] pairs, newest-window filtered in service. */
    @Query("SELECT i.productId, SUM(i.quantity) FROM OrderItem i JOIN Order o ON o.id = i.orderId "
            + "WHERE o.status NOT IN ('CANCELLED','REFUNDED') GROUP BY i.productId ORDER BY SUM(i.quantity) DESC")
    List<Object[]> bestSellers(org.springframework.data.domain.Pageable page);
}
