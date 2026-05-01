package com.pbl.pbl.controller;

import com.pbl.pbl.entity.Coupon;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.repository.CouponRepository;
import com.pbl.pbl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;

    @GetMapping("/available")
    public ResponseEntity<List<Coupon>> getAvailableRewards() {
        return ResponseEntity.ok(couponRepository.findByUserIsNull());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Coupon>> getMyCoupons() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(couponRepository.findByUserAndIsUsedFalse(user));
    }

    @PostMapping("/exchange")
    public ResponseEntity<?> exchangePoints(@RequestParam Long couponId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Coupon template = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("Reward not found"));
        
        if (user.getLoyaltyPoints() < template.getPointCost()) {
            return ResponseEntity.badRequest().body("Không đủ điểm để đổi mã này");
        }
        
        user.setLoyaltyPoints(user.getLoyaltyPoints() - template.getPointCost());
        userRepository.save(user);
        
        Coupon newCoupon = Coupon.builder()
                .code("CPN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .discountValue(template.getDiscountValue())
                .pointCost(template.getPointCost())
                .imageUrl(template.getImageUrl())
                .user(user)
                .isUsed(false)
                .build();
                
        couponRepository.save(newCoupon);
        return ResponseEntity.ok(newCoupon);
    }
}
