package com.pbl.pbl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketResponseDTO {
    private Long id;
    private String image;
    private String title;
    private String ticketId;
    private String date;
    private String seat;
    private String location;
    private String type;
    private String status;
    private String orderQrCode;
    private Long orderId;
}
