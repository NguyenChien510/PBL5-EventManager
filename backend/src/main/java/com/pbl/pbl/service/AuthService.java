package com.pbl.pbl.service;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.pbl.pbl.config.JwtTokenProvider;
import com.pbl.pbl.dto.TokenResponse;
import com.pbl.pbl.dto.SignUpDTO;
import com.pbl.pbl.entity.RefreshToken;
import com.pbl.pbl.entity.Role;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.exception.DuplicateResourceException;
import com.pbl.pbl.exception.InvalidCredentialsException;
import com.pbl.pbl.exception.TokenException;
import com.pbl.pbl.exception.UserNotFoundException;
import com.pbl.pbl.exception.ResourceNotFoundException;
import com.pbl.pbl.mapper.UserMapper;
import com.pbl.pbl.repository.RefreshTokenRepository;
import com.pbl.pbl.repository.RoleRepository;
import com.pbl.pbl.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshExpiration;

    @Transactional
    public TokenResponse login(String username, String password) {
        try {
            // Verify user exists
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new InvalidCredentialsException());

            // Authenticate
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate tokens
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String accessToken = tokenProvider.generateAccessToken(userDetails);
            String refreshTokenValue = tokenProvider.generateRefreshToken();

            // Save refresh token
            RefreshToken refreshToken = RefreshToken.builder()
                    .token(refreshTokenValue)
                    .user(user)
                    .expiresAt(Instant.now().plusSeconds(refreshExpiration / 1000))
                    .build();
            refreshTokenRepository.save(refreshToken);

            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshTokenValue)
                    .user(userMapper.toDto(user))
                    .build();
                    
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new InvalidCredentialsException();
        }
    }

    @Transactional
    public TokenResponse refreshToken(String refreshTokenValue) {
        // Find and validate refresh token
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(TokenException::notFound);
                
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw TokenException.expired();
        }

        User user = refreshToken.getUser();
        
        // Generate new tokens
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                    user.getRole().getName()))
                .build();

        String newAccessToken = tokenProvider.generateAccessToken(userDetails);
        String newRefreshTokenValue = tokenProvider.generateRefreshToken();

        // Replace refresh token
        refreshTokenRepository.delete(refreshToken);
        
        RefreshToken newRefreshToken = RefreshToken.builder()
                .token(newRefreshTokenValue)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(refreshExpiration / 1000))
                .build();
        refreshTokenRepository.save(newRefreshToken);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenValue)
                .user(userMapper.toDto(user))
                .build();
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(token -> refreshTokenRepository.delete(token));
    }

    @Transactional
    public SignUpDTO signup(SignUpDTO request) {
        // Check for duplicate username
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw DuplicateResourceException.username(request.getUsername());
        }

        // Check for duplicate email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw DuplicateResourceException.email(request.getEmail());
        }

        // Get default role
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> ResourceNotFoundException.role("USER"));
                
        // Create new user
        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(userRole)
                .build();

        userRepository.save(newUser);

        return SignUpDTO.builder()
                .username(newUser.getUsername())
                .email(newUser.getEmail())
                .fullName(newUser.getFullName())
                .build();
    }
}
