package com.pbl.pbl.repository;

import com.pbl.pbl.entity.Coupon;
import com.pbl.pbl.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByUserAndIsUsedFalse(User user);
    List<Coupon> findByUserIsNull(); // Available for exchange
}
