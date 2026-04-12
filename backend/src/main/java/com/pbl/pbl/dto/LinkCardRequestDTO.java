package com.pbl.pbl.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkCardRequestDTO {

    @NotBlank(message = "Last four digits are required")
    @Pattern(regexp = "\\d{4}", message = "Enter exactly 4 digits")
    private String cardLastFour;
}
