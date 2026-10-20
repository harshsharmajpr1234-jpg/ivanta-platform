package com.ivanta.location;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StateRepository extends JpaRepository<StateEntity, String> {
    List<StateEntity> findAllByIsActiveTrueOrderByNameAsc();
}
