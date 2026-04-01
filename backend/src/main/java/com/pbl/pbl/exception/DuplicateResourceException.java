package com.pbl.pbl.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends BaseException {
    
    public DuplicateResourceException(String resource, String field, String value) {
        super(String.format("%s with %s '%s' already exists", resource, field, value), 
              HttpStatus.CONFLICT, "DUPLICATE_RESOURCE");
    }


    public static DuplicateResourceException email(String email) {
        return new DuplicateResourceException("User", "email", email);
    }
}
