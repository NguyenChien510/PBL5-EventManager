package com.pbl.pbl.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTopUpRequestDTO {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1000", message = "Minimum top-up is 1,000 VND")
    @DecimalMax(value = "100000000", message = "Maximum top-up is 100,000,000 VND per request")
    private BigDecimal amount;
}
