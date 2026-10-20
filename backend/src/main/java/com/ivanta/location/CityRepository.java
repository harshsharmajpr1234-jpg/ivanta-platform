package com.ivanta.location;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CityRepository extends JpaRepository<City, String> {
    List<City> findByIsActiveTrueAndPopularTrueOrderByNameAsc();
    List<City> findByStateIdAndIsActiveTrueOrderByNameAsc(String stateId);
    List<City> findTop10ByNameStartingWithIgnoreCaseAndIsActiveTrue(String prefix);
    @Query("SELECT c FROM City c WHERE c.isActive = true AND LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<City> searchContains(@Param("q") String q, Pageable page);
}
