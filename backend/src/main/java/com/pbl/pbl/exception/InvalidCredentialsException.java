package com.pbl.pbl.exception;

import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends BaseException {
    
    public InvalidCredentialsException() {
        super("Sai tên đăng nhập hoặc mật khẩu", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    public InvalidCredentialsException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }
}
