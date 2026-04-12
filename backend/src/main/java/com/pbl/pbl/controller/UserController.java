package com.pbl.pbl.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pbl.pbl.dto.LinkCardRequestDTO;
import com.pbl.pbl.dto.ProfileWalletDTO;
import com.pbl.pbl.dto.UpdateProfileRequestDTO;
import com.pbl.pbl.dto.UserDTO;
import com.pbl.pbl.dto.UserProfileOverviewDTO;
import com.pbl.pbl.dto.WalletTopUpRequestDTO;
import com.pbl.pbl.service.UserProfileService;
import com.pbl.pbl.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        UserDTO user = userService.getCurrentUser();
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me/overview")
    public ResponseEntity<UserProfileOverviewDTO> getProfileOverview() {
        return ResponseEntity.ok(userProfileService.getOverview());
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody UpdateProfileRequestDTO request) {
        return ResponseEntity.ok(userProfileService.updateProfile(request));
    }

    @PostMapping("/me/wallet/top-up")
    public ResponseEntity<ProfileWalletDTO> topUpWallet(@Valid @RequestBody WalletTopUpRequestDTO request) {
        return ResponseEntity.ok(userProfileService.topUpWallet(request));
    }

    @PatchMapping("/me/wallet/card")
    public ResponseEntity<ProfileWalletDTO> linkCard(@Valid @RequestBody LinkCardRequestDTO request) {
        return ResponseEntity.ok(userProfileService.linkCard(request));
    }
}
