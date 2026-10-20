package com.ivanta.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ZoneRepository extends JpaRepository<ServiceabilityZone, String> {
    List<ServiceabilityZone> findByIsActiveTrue();

    @Query("SELECT z FROM ServiceabilityZone z WHERE z.isActive = true AND z.serviceable = true "
            + "AND z.id IN (SELECT z2.id FROM ServiceabilityZone z2 JOIN z2.pinPrefixes p WHERE :pin LIKE CONCAT(p, '%'))")
    List<ServiceabilityZone> findServiceableByPinPrefix(@Param("pin") String pin);

    @Query("SELECT z FROM ServiceabilityZone z WHERE z.isActive = true "
            + "AND z.id IN (SELECT z2.id FROM ServiceabilityZone z2 JOIN z2.pinPrefixes p WHERE :pin LIKE CONCAT(p, '%'))")
    List<ServiceabilityZone> findAnyByPinPrefix(@Param("pin") String pin);

    @Query("SELECT z FROM ServiceabilityZone z WHERE z.isActive = true AND z.serviceable = true "
            + "AND :cityId IN (SELECT c.id FROM City c JOIN c.zones cz WHERE cz.id = z.id)")
    List<ServiceabilityZone> findServiceableByCity(@Param("cityId") String cityId);
}
