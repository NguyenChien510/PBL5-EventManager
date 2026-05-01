package com.pbl.pbl.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;

@Data
@Builder
public class OrderDTO {
    private Long id;
    private String userEmail;
    private String userName;
    private BigDecimal totalAmount;
    private BigDecimal platformFee;
    private String status;
    private String paymentMethod;
    private LocalDateTime purchaseDate;
    private Long eventId;
    private String eventTitle;
    private String eventPosterUrl;
    private Long eventSessionId; 
    private String qrCode;
    private List<TicketDetailDTO> tickets;

    @Data
    @Builder
    public static class TicketDetailDTO {
        private Long id;
        private String eventTitle;
        private String seatNumber;
        private BigDecimal price;
        private String sessionName;
        private Long seatId; 
    }
}
