package com.pbl.pbl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PasswordChangeRequestDTO {
    private String currentPassword;
    private String newPassword;
    private String confirmPassword;
}
