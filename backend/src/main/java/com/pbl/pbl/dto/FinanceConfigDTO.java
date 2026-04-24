package com.pbl.pbl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceConfigDTO {
    private String defaultCommissionRate;
    private String fixedFeePerTicket;
    private String minWithdrawalAmount;
    private String withdrawalProcessTime;
}
