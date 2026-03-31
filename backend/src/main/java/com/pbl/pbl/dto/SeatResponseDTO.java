package com.pbl.pbl.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class SeatResponseDTO {
    private Long id;
    private String seatNumber;
    private String status;
    private String ticketTypeName;
    private BigDecimal price;
}
