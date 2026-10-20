package com.ivanta.returnrefund;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, String> {
    List<ReturnRequest> findByUserIdOrderByIdDesc(String userId);
    List<ReturnRequest> findByOrderId(String orderId);
    Page<ReturnRequest> findAllByOrderByIdDesc(Pageable page);
    Page<ReturnRequest> findByStatusOrderByIdDesc(String status, Pageable page);
    long countByStatus(String status);
}
