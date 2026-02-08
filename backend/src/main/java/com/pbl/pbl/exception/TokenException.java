package com.pbl.pbl.exception;

import org.springframework.http.HttpStatus;

public class TokenException extends BaseException {
    
    public TokenException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN");
    }

    public static TokenException invalid() {
        return new TokenException("Invalid or malformed token");
    }

    public static TokenException expired() {
        return new TokenException("Token has expired");
    }

    public static TokenException notFound() {
        return new TokenException("Token not found");
    }
}
