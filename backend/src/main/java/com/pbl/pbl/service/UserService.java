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

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMapper userMapper;

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

    public java.util.List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .toList();
    }
}
