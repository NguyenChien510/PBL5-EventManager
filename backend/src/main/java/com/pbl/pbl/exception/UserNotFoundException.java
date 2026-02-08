package com.pbl.pbl.exception;

import org.springframework.http.HttpStatus;

public class UserNotFoundException extends BaseException {
    
    public UserNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }

    public UserNotFoundException(String username, String field) {
        super(String.format("User with %s '%s' not found", field, username), 
              HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }
}
