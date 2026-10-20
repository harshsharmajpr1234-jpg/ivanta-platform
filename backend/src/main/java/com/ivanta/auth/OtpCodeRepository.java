package com.ivanta.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByIdentifierAndUsedAtIsNullAndExpiresAtAfterOrderByIdDesc(String identifier, Instant now);
    long countByIdentifierAndCreatedAtAfter(String identifier, Instant since);
}
