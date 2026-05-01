package com.pbl.pbl.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.pbl.pbl.dto.UserDTO;
import com.pbl.pbl.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.pbl.pbl.dto.PasswordChangeRequestDTO;

import com.pbl.pbl.dto.UpdateNameRequestDTO;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        UserDTO user = userService.getCurrentUser();
        return ResponseEntity.ok(user);
    }

    @PostMapping("/update-name")
    public ResponseEntity<UserDTO> updateName(@RequestBody UpdateNameRequestDTO request) {
        UserDTO updatedUser = userService.updateFullName(request);
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody PasswordChangeRequestDTO request) {
        userService.changePassword(request);
        return ResponseEntity.ok("Mật khẩu đã được thay đổi thành công");
    }

    @GetMapping("/all")
    public ResponseEntity<java.util.List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

}
