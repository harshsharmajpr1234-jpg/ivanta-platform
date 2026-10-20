package com.ivanta.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, String> {
    Page<ProductReview> findByProductIdAndStatusOrderByIdDesc(String productId, String status, Pageable page);
    List<ProductReview> findByUserIdOrderByIdDesc(String userId);
    boolean existsByProductIdAndUserId(String productId, String userId);
    Page<ProductReview> findAllByOrderByIdDesc(Pageable page);
    Page<ProductReview> findByStatusOrderByIdDesc(String status, Pageable page);
    long countByStatus(String status);

    @Query("SELECT COALESCE(AVG(r.rating),0), COUNT(r) FROM ProductReview r WHERE r.productId = :pid AND r.status = 'APPROVED'")
    List<Object[]> ratingStats(@Param("pid") String productId);

    /** Orders of the user containing this product in a terminal delivered state. */
    @Query("SELECT o.id FROM com.ivanta.order.Order o JOIN com.ivanta.order.OrderItem i ON i.orderId = o.id "
            + "WHERE o.userId = :userId AND i.productId = :productId "
            + "AND o.status IN ('DELIVERED','RETURN_REQUESTED','RETURNED','REFUNDED')")
    List<String> eligibleOrders(@Param("userId") String userId, @Param("productId") String productId);
}
