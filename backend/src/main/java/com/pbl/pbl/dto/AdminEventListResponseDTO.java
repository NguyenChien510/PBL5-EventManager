package com.pbl.pbl.dto;

import org.springframework.data.domain.Page;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminEventListResponseDTO {
    private Page<EventAdminSummaryDTO> events;
    private long pendingCount;
    private long processedCount;
}
