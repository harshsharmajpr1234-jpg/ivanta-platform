package com.ivanta.location;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PincodeRepository extends JpaRepository<Pincode, String> {
    Optional<Pincode> findByCode(String code);
    List<Pincode> findTop10ByCodeStartingWithAndIsActiveTrue(String prefix);
}
