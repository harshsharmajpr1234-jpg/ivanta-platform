package com.ivanta.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AdminSessionRepository extends JpaRepository<AdminSession, String> {
    List<AdminSession> findByAdminIdAndRevokedAtIsNull(String adminId);

    @Modifying
    @Query("UPDATE AdminSession s SET s.revokedAt = :now WHERE s.revokedAt IS NULL")
    int revokeAll(@Param("now") Instant now);

    @Modifying
    @Query("UPDATE AdminSession s SET s.revokedAt = :now WHERE s.adminId = :adminId AND s.revokedAt IS NULL AND s.tokenHash <> :keep")
    int revokeOthers(@Param("adminId") String adminId, @Param("keep") String keepHash, @Param("now") Instant now);
}
