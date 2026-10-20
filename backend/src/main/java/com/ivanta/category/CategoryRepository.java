package com.ivanta.category;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {
    List<Category> findByIsActiveTrueOrderBySortOrderAsc();
    List<Category> findByParentIdAndIsActiveTrueOrderBySortOrderAsc(String parentId);
    Optional<Category> findBySlugAndIsActiveTrue(String slug);
    Optional<Category> findByNameIgnoreCase(String name);
}
