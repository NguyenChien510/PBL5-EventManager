package com.pbl.pbl.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileTicketPreviewDTO {
    private Long id;
    private String code;
    private String eventTitle;
    private String ticketTierLabel;
    private LocalDateTime purchaseDate;
}
