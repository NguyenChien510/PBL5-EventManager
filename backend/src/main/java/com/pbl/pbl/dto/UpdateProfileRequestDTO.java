package com.pbl.pbl.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDTO {

    @Size(max = 120, message = "Full name must be at most 120 characters")
    private String fullName;

    @Size(max = 500, message = "Avatar URL must be at most 500 characters")
    private String avatarUrl;
}
