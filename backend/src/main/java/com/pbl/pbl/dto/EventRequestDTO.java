package com.pbl.pbl.dto;

import java.util.List;
import lombok.Data;

@Data
public class EventRequestDTO {
    private String title;
    private Long categoryId;
    private List<String> artists;

    private String description;
    private String location;
    private Long provinceId;
    private Long wardId;
    private Double latitude;
    private Double longitude;
    private String posterUrl;
    private List<EventSessionRequestDTO> sessions;
    private SeatMapConfigRequestDTO seatMapConfig;
    private List<TicketTypeRequestDTO> ticketTypes;
    private List<EventScheduleRequestDTO> schedules;
    private Boolean hasSeatMap;
    private String seatMapLayout;
}
