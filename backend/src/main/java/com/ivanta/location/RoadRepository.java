package com.ivanta.location;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoadRepository extends JpaRepository<Road, String> {
    List<Road> findByLocalityIdAndIsActiveTrue(String localityId);
}
