package com.pbl.pbl.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.pbl.pbl.entity.EventStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpcomingEventCardDTO {
    private Long id;
    private String title;
    private String location;
    private LocalDateTime startTime;
    private String posterUrl;
    private Integer ticketsLeft;
    private Integer totalTickets;
    private EventStatus status;
    private String categoryName;
    private String categoryColor;
    private String provinceName;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Double latitude;
    private Double longitude;
}

