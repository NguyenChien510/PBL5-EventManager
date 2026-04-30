package com.pbl.pbl.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.pbl.pbl.entity.EventStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAdminSummaryDTO {
    private Long id;
    private String title;
    private String location;
    private String posterUrl;
    private LocalDateTime startTime;
    private LocalDateTime createdAt;
    private EventStatus status;
    private String categoryName;
    private String categoryColor;
    private String organizerName;
    private String organizerEmail;
    private int ticketsSold;
    private int totalTickets;
    private String rejectReason;
}
