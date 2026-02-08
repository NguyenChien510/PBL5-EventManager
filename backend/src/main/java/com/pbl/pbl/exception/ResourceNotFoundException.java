package com.pbl.pbl.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BaseException {
    
    public ResourceNotFoundException(String resource, String field, String value) {
        super(String.format("%s with %s '%s' not found", resource, field, value), 
              HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
    }

    public static ResourceNotFoundException role(String roleName) {
        return new ResourceNotFoundException("Role", "name", roleName);
    }
}
