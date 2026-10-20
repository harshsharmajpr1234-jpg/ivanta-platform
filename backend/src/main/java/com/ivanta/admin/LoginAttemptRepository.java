package com.ivanta.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    long countByIdentifierAndSuccessFalseAndCreatedAtAfter(String identifier, Instant since);
    List<LoginAttempt> findAllByOrderByCreatedAtDesc(Pageable page);
}
