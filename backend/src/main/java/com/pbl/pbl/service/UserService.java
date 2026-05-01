package com.pbl.pbl.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.pbl.pbl.dto.UserDTO;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.exception.UnauthorizedException;
import com.pbl.pbl.exception.UserNotFoundException;
import com.pbl.pbl.mapper.UserMapper;
import com.pbl.pbl.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.pbl.pbl.dto.PasswordChangeRequestDTO;
import com.pbl.pbl.dto.UserDTO;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.exception.BadRequestException;
import com.pbl.pbl.exception.InvalidCredentialsException;
import com.pbl.pbl.exception.UnauthorizedException;
import com.pbl.pbl.exception.UserNotFoundException;
import com.pbl.pbl.mapper.UserMapper;
import com.pbl.pbl.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import com.pbl.pbl.dto.UpdateNameRequestDTO;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("Attempt to get current user without authentication");
            throw UnauthorizedException.notAuthenticated();
        }

        // authentication.getName() now holds the email since we put email as the UserDetails username
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email, "email"));

        log.debug("Retrieved current user: {}", email);
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDTO updateFullName(UpdateNameRequestDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw UnauthorizedException.notAuthenticated();
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email, "email"));

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên không được để trống");
        }

        user.setFullName(request.getFullName().trim());
        User updatedUser = userRepository.save(user);
        log.info("Full name updated for user: {}", email);
        return userMapper.toDto(updatedUser);
    }

    @Transactional
    public void changePassword(PasswordChangeRequestDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw UnauthorizedException.notAuthenticated();
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email, "email"));

        // Check current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            log.warn("Password change failed: current password mismatch for user {}", email);
            throw new InvalidCredentialsException();
        }

        // Check if new password matches confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", email);
    }

    public java.util.List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .toList();
    }
}
