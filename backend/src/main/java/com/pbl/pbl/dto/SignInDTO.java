package com.pbl.pbl.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignInDTO {
    @NotBlank
    @jakarta.validation.constraints.Email
    private String email;

    @NotBlank
    private String password;
}
