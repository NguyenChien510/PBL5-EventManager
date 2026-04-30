package com.pbl.pbl.controller;

import com.pbl.pbl.dto.PaymentDTO;
import com.pbl.pbl.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/api/payment/create")
    public ResponseEntity<?> createPayment(@RequestBody PaymentDTO paymentDTO, HttpServletRequest request) {
        try {
            String paymentUrl = paymentService.createPayment(paymentDTO, request);
            Map<String, String> response = new HashMap<>();
            response.put("url", paymentUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/api/public/payment/vnpay-return")
    public RedirectView paymentReturn(HttpServletRequest request) {
        int paymentStatus = paymentService.orderReturn(request);

        // 1: Success
        // 0: Failed transaction
        // -1: Ticket not found or invalid format
        // -2: Checksum invalid

        String statusText;
        if (paymentStatus == 1) statusText = "success";
        else if (paymentStatus == 0) statusText = "failed";
        else statusText = "invalid";

        String orderInfo = request.getParameter("vnp_OrderInfo");
        String transactionId = request.getParameter("vnp_TransactionNo");

        // Set up the Frontend specific URL
        String frontendUrl = "http://localhost:5173/payment-result";
        
        try {
            String encodedOrderInfo = java.net.URLEncoder.encode(orderInfo != null ? orderInfo : "", java.nio.charset.StandardCharsets.UTF_8);
            String encodedTransactionId = java.net.URLEncoder.encode(transactionId != null ? transactionId : "", java.nio.charset.StandardCharsets.UTF_8);
            
            return new RedirectView(frontendUrl + "?status=" + statusText 
                    + "&orderInfo=" + encodedOrderInfo
                    + "&transactionId=" + encodedTransactionId);
        } catch (Exception e) {
            return new RedirectView(frontendUrl + "?status=error&message=" + java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    @GetMapping("/api/public/payment/momo-return")
    public RedirectView momoPaymentReturn(HttpServletRequest request) {
        int paymentStatus = paymentService.orderReturnMomo(request);

        String statusText;
        if (paymentStatus == 1) statusText = "success";
        else if (paymentStatus == 0) statusText = "failed";
        else statusText = "invalid";

        String orderInfo = request.getParameter("orderInfo");
        String transactionId = request.getParameter("transId");

        String frontendUrl = "http://localhost:5173/payment-result";
        
        try {
            String encodedOrderInfo = java.net.URLEncoder.encode(orderInfo != null ? orderInfo : "", java.nio.charset.StandardCharsets.UTF_8);
            String encodedTransactionId = java.net.URLEncoder.encode(transactionId != null ? transactionId : "", java.nio.charset.StandardCharsets.UTF_8);
            
            return new RedirectView(frontendUrl + "?status=" + statusText 
                    + "&orderInfo=" + encodedOrderInfo
                    + "&transactionId=" + encodedTransactionId);
        } catch (Exception e) {
            return new RedirectView(frontendUrl + "?status=error&message=" + java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8));
        }
    }
}
