package com.pbl.pbl.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pbl.pbl.config.MoMoConfig;
import com.pbl.pbl.dto.PaymentDTO;
import com.pbl.pbl.entity.Order;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component("momo")
public class MoMoPaymentGateway implements PaymentGateway {

    private final MoMoConfig moMoConfig;
    private final ObjectMapper objectMapper;

    public MoMoPaymentGateway(MoMoConfig moMoConfig, ObjectMapper objectMapper) {
        this.moMoConfig = moMoConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public String process(PaymentDTO paymentDTO, Order order, HttpServletRequest request) throws Exception {
        String orderId = order.getId().toString();
        String amount = String.valueOf(paymentDTO.getAmount());
        String orderInfo = paymentDTO.getOrderInfo();
        String requestId = String.valueOf(System.currentTimeMillis());
        String extraData = "";

        String rawHash = "accessKey=" + moMoConfig.getAccessKey() +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&ipnUrl=" + moMoConfig.getIpnUrl() +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + moMoConfig.getPartnerCode() +
                "&redirectUrl=" + moMoConfig.getRedirectUrl() +
                "&requestId=" + requestId +
                "&requestType=captureWallet";

        String signature = moMoConfig.hmacSHA256(rawHash);

        ObjectNode jsonNode = objectMapper.createObjectNode();
        jsonNode.put("partnerCode", moMoConfig.getPartnerCode());
        jsonNode.put("partnerName", "Event Platform");
        jsonNode.put("storeId", "MomoTestStore");
        jsonNode.put("requestId", requestId);
        jsonNode.put("amount", paymentDTO.getAmount());
        jsonNode.put("orderId", orderId);
        jsonNode.put("orderInfo", orderInfo);
        jsonNode.put("redirectUrl", moMoConfig.getRedirectUrl());
        jsonNode.put("ipnUrl", moMoConfig.getIpnUrl());
        jsonNode.put("lang", "vi");
        jsonNode.put("extraData", extraData);
        jsonNode.put("requestType", "captureWallet");
        jsonNode.put("signature", signature);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(new URI(moMoConfig.getUrl()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonNode.toString()))
                .build();

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        JsonNode responseNode = objectMapper.readTree(response.body());

        if (responseNode.has("payUrl")) {
            return responseNode.get("payUrl").asText();
        } else {
            throw new Exception("Lỗi khi kết nối MoMo: " + responseNode.toString());
        }
    }
}
