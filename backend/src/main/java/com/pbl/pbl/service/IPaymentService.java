package com.pbl.pbl.service;

import com.pbl.pbl.dto.PaymentDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface IPaymentService {
    String createPayment(PaymentDTO paymentDTO, HttpServletRequest request) throws Exception;
    int orderReturn(HttpServletRequest request);
    int orderReturnMomo(HttpServletRequest request);
}
