package com.pbl.pbl.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TicketTypeResponseDTO {
    private Long id;
    private String name;
    private BigDecimal price;
    private Integer totalQuantity;
}
