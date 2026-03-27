package com.pbl.pbl.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class TicketTypeRequestDTO {
    private String name;
    private BigDecimal price;
    private Integer totalQuantity;
}
