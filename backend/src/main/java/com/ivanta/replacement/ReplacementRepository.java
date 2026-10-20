package com.ivanta.replacement;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReplacementRepository extends JpaRepository<Replacement, String> {
    List<Replacement> findByOrderId(String orderId);
    List<Replacement> findByUserIdOrderByIdDesc(String userId);
    Optional<Replacement> findByReplacementOrderId(String replacementOrderId);
    List<Replacement> findAllByOrderByIdDesc(Pageable page);
    List<Replacement> findByStatusOrderByIdDesc(String status, Pageable page);
    long countByStatusIn(List<String> statuses);
}
