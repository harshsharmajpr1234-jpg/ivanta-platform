package com.ivanta.location;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostOfficeRepository extends JpaRepository<PostOffice, String> {
    List<PostOffice> findByPincodeIdAndIsActiveTrue(String pincodeId);
}
