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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

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

    @PostMapping("/upload-avatar")
    public ResponseEntity<UserDTO> uploadAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        UserDTO updatedUser = userService.updateAvatar(file);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

}
