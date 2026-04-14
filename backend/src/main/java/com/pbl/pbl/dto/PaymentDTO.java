package com.pbl.pbl.dto;

import lombok.Data;

import java.util.UUID;
import java.util.List;

@Data
public class PaymentDTO {
    private long amount;
    private String orderInfo;
    private UUID userId;
    private List<Long> seatIds;
    private String paymentMethod;
}
