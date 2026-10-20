package com.ivanta.category;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, String> {
    List<Brand> findByIsActiveTrueOrderByNameAsc();
}
