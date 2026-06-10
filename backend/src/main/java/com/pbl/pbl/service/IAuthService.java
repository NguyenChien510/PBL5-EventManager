package com.pbl.pbl.service;

import com.pbl.pbl.dto.TokenResponse;
import com.pbl.pbl.dto.SignUpDTO;

public interface IAuthService {
    TokenResponse login(String email, String password);
    TokenResponse signup(SignUpDTO request);
    TokenResponse googleLogin(String credential);
    TokenResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
    String getGoogleClientId();
}
