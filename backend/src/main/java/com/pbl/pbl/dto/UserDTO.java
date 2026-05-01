package com.pbl.pbl.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private UUID id;
    private String email;
    private String fullName;
    private RoleDTO role;
    private Long loyaltyPoints;
    private String avatar;
    private java.time.Instant createdAt;
}
