package com.pbl.pbl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileStatsDTO {
    private long eventsAttendedCount;
    private long activeTicketsCount;
}
