package com.pbl.pbl.dto;

import lombok.Data;

@Data
public class SeatRequestDTO {
    private Double x;
    private Double y;
    private String ticketTypeName;
    private String seatNumber;
}
