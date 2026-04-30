package com.pbl.pbl.dto;

import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizerDashboardResponseDTO {
    private long totalEvents;
    private long totalTicketsSold;
    private BigDecimal totalRevenue;
    private long rejectedCount;
    private Page<EventAdminSummaryDTO> events;
}
