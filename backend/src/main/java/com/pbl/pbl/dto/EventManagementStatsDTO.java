package com.pbl.pbl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventManagementStatsDTO {
    private long totalSeats;
    private long soldSeats;
    private long checkedInSeats;
    private BigDecimal totalRevenue;
    private Map<String, Long> salesByTicketType;
    private Map<String, BigDecimal> dailyRevenue;
}
