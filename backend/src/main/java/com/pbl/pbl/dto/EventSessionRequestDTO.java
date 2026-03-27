package com.pbl.pbl.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Data;

@Data
public class EventSessionRequestDTO {
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String name;
}
