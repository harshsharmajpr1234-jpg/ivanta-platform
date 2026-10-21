package com.ivanta.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PincodeLookupCacheRepository extends JpaRepository<PincodeLookupCache, String> {
    Optional<PincodeLookupCache> findByPincodeAndExpiresAtAfter(String pincode, Instant now);
}
