package com.ivanta.location;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DistrictRepository extends JpaRepository<District, String> {
    List<District> findByStateIdAndIsActiveTrueOrderByNameAsc(String stateId);
}
