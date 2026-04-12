package com.pbl.pbl.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pbl.pbl.dto.TokenResponse;
import com.pbl.pbl.dto.UserDTO;
import com.pbl.pbl.dto.SignInDTO;
import com.pbl.pbl.dto.SignUpDTO;
import com.pbl.pbl.dto.GoogleLoginDTO;
import com.pbl.pbl.service.AuthService;
import com.pbl.pbl.service.UserService;
import com.pbl.pbl.util.CookieUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    @Value("${jwt.refresh-token-expiration}")
    private long refreshExpirationMs;

    @Value("${app.security.refresh-cookie-secure:false}")
    private boolean refreshCookieSecure;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PostMapping("/signin")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody SignInDTO request) {
        TokenResponse tokens = authService.login(request.getEmail(), request.getPassword());

        ResponseCookie refreshCookie = CookieUtil.createRefreshCookie(
                REFRESH_TOKEN_COOKIE,
                tokens.getRefreshToken(),
                refreshExpirationMs / 1000,
                refreshCookieSecure);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokens);
    }

    @PostMapping("/signup")
    public ResponseEntity<TokenResponse> signup(@Valid @RequestBody SignUpDTO request) {
        TokenResponse tokens = authService.signup(request);

        ResponseCookie refreshCookie = CookieUtil.createRefreshCookie(
                REFRESH_TOKEN_COOKIE,
                tokens.getRefreshToken(),
                refreshExpirationMs / 1000,
                refreshCookieSecure);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokens);
    }

    @PostMapping("/google")
    public ResponseEntity<TokenResponse> googleLogin(@Valid @RequestBody GoogleLoginDTO request) {
        TokenResponse tokens = authService.googleLogin(request.getCredential());

        ResponseCookie refreshCookie = CookieUtil.createRefreshCookie(
                REFRESH_TOKEN_COOKIE,
                tokens.getRefreshToken(),
                refreshExpirationMs / 1000,
                refreshCookieSecure);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokens);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        TokenResponse tokens = authService.refreshToken(refreshToken);

        ResponseCookie refreshCookie = CookieUtil.createRefreshCookie(
                REFRESH_TOKEN_COOKIE,
                tokens.getRefreshToken(),
                refreshExpirationMs / 1000,
                refreshCookieSecure);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokens);
    }

    @PostMapping("/signout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        if (refreshToken != null && !refreshToken.isEmpty()) {
            authService.logout(refreshToken);
        }

        ResponseCookie deleteCookie = CookieUtil.deleteCookie(REFRESH_TOKEN_COOKIE, refreshCookieSecure);

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .build();
    }
}
