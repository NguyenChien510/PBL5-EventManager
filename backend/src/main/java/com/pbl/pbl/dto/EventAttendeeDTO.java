package com.pbl.pbl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAttendeeDTO {
    private Long ticketId;
    private Long orderId;
    private String userName;
    private String userEmail;
    private String seatNumber;
    private String ticketTypeName;
    private String status; // TicketStatus
    private java.time.LocalDateTime purchaseDate;
    private java.time.LocalDateTime checkInDate;
    private String userAvatar;
    private String ticketTypeColor;
}
