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
    private String status;
    private String paymentMethod;
    private LocalDateTime purchaseDate;
    private Long eventSessionId; // Required to fetch the seat map for THIS specific session
    private List<TicketDetailDTO> tickets;

    @Data
    @Builder
    public static class TicketDetailDTO {
        private Long id;
        private String eventTitle;
        private String seatNumber;
        private BigDecimal price;
        private String sessionName;
        private Long seatId; // To identify the seat in the full layout
    }
}
