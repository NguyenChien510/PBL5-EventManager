package com.pbl.pbl.dto;

import java.time.LocalDateTime;
import java.util.List;
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
public class EventResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String posterUrl;
    private Double latitude;
    private Double longitude;
    private EventStatus status;
    private String rejectReason;
    private LocalDateTime createdAt;
    private List<ArtistDTO> artists;
    private Integer totalTickets;
    private Integer ticketsLeft;
    private Boolean hasSeatMap;
    private String seatMapLayout;

    
    private CategoryDTO category;
    private ProvinceDTO province;
    private OrganizerInfoDTO organizer;
    
    private List<EventScheduleResponseDTO> schedules;
    private List<SessionDTO> sessions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionDTO {
        private Long id;
        private java.time.LocalDate sessionDate;
        private java.time.LocalTime startTime;
        private java.time.LocalTime endTime;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDTO {
        private Long id;
        private String name;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProvinceDTO {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizerInfoDTO {
        private UUID id;
        private String fullName;
        private String email;
        private String avatar;
    }
}
