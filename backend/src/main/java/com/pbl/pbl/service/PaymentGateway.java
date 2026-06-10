package com.pbl.pbl.service;

import com.pbl.pbl.dto.PaymentDTO;
import com.pbl.pbl.entity.Order;
import jakarta.servlet.http.HttpServletRequest;

public interface PaymentGateway {
    String process(PaymentDTO paymentDTO, Order order, HttpServletRequest request) throws Exception;
}
