package com.ivanta.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderDocumentRepository extends JpaRepository<OrderDocument, Long> {
    List<OrderDocument> findByOrderIdOrderByIdAsc(String orderId);
}
