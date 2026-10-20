package com.ivanta.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, String> {
    List<Address> findByUserIdAndIsActiveTrueAndDeletedAtIsNullOrderByIdDesc(String userId);
    Optional<Address> findByIdAndUserIdAndDeletedAtIsNull(String id, String userId);
    Optional<Address> findFirstByUserIdAndIsDefaultTrueAndDeletedAtIsNull(String userId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.userId = :userId")
    int clearDefaults(@Param("userId") String userId);
}
