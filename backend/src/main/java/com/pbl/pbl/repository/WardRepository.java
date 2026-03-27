package com.pbl.pbl.repository;

import com.pbl.pbl.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WardRepository extends JpaRepository<Ward, Long> {
    List<Ward> findByProvinceId(Long provinceId);
}
