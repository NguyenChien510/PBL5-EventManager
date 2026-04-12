package com.pbl.pbl.dto;

import java.time.Instant;
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
    private String avatarUrl;
    private Integer loyaltyPoints;
    private String membershipTier;
    private Integer joinYear;
    private Instant createdAt;
    private RoleDTO role;
}
