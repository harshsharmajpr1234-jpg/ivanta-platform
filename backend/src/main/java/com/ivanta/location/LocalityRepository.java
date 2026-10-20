package com.ivanta.location;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LocalityRepository extends JpaRepository<Locality, String> {
    List<Locality> findByCityIdAndIsActiveTrueOrderByNameAsc(String cityId);
    List<Locality> findTop10ByNameStartingWithIgnoreCaseAndIsActiveTrue(String prefix);
    Optional<Locality> findFirstByNameIgnoreCaseAndIsActiveTrue(String name);
    @Query("SELECT l FROM Locality l WHERE l.isActive = true AND LOWER(l.name) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Locality> searchContains(@Param("q") String q, Pageable page);
}
