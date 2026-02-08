package com.pbl.pbl.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BaseException {
    
    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public static UnauthorizedException notAuthenticated() {
        return new UnauthorizedException("User not authenticated");
    }

    public static UnauthorizedException accessDenied() {
        return new UnauthorizedException("Access denied");
    }
}
