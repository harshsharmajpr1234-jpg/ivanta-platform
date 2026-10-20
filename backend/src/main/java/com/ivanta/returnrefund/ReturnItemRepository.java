package com.ivanta.returnrefund;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReturnItemRepository extends JpaRepository<ReturnItem, String> {
    List<ReturnItem> findByReturnId(String returnId);
}
