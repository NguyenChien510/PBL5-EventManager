package com.pbl.pbl.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pbl.pbl.config.MoMoConfig;
import com.pbl.pbl.config.VNPayConfig;
import com.pbl.pbl.dto.PaymentDTO;
import com.pbl.pbl.entity.Order;
import com.pbl.pbl.entity.OrderStatus;
import com.pbl.pbl.entity.Seat;
import com.pbl.pbl.entity.SeatStatus;
import com.pbl.pbl.entity.Ticket;
import com.pbl.pbl.entity.TicketStatus;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.repository.OrderRepository;
import com.pbl.pbl.repository.SeatRepository;
import com.pbl.pbl.repository.TicketRepository;
import com.pbl.pbl.repository.UserRepository;
import com.pbl.pbl.repository.EventRepository;
import com.pbl.pbl.repository.SystemConfigRepository;
import com.pbl.pbl.repository.CouponRepository;
import com.pbl.pbl.entity.SystemConfig;
import com.pbl.pbl.entity.Coupon;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final VNPayConfig vnPayConfig;
    private final MoMoConfig moMoConfig;
    private final TicketRepository ticketRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final CouponRepository couponRepository;
    private final EmailService emailService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public String createPayment(PaymentDTO paymentDTO, HttpServletRequest request) throws Exception {
        if (paymentDTO.getSeatIds() == null || paymentDTO.getSeatIds().isEmpty()) {
            throw new IllegalArgumentException("Danh sách ghế không được trống");
        }

        User user = userRepository.findById(paymentDTO.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean autoApply = systemConfigRepository.findById("AUTO_APPLY_COMMISSION")
                .map(c -> Boolean.parseBoolean(c.getConfigValue()))
                .orElse(true);

        BigDecimal amount = BigDecimal.valueOf(paymentDTO.getAmount());
        BigDecimal platformFee = BigDecimal.ZERO;
        
        if (autoApply) {
            String taxRateStr = systemConfigRepository.findById("DEFAULT_COMMISSION_RATE")
                    .map(SystemConfig::getConfigValue)
                    .orElse("10"); // Default 10%
            BigDecimal taxRate = new BigDecimal(taxRateStr);
            
            // platformFee = amount * taxRate / 100
            platformFee = amount.multiply(taxRate).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        }

        // Check coupon
        Coupon appliedCoupon = null;
        if (paymentDTO.getCouponCode() != null && !paymentDTO.getCouponCode().trim().isEmpty()) {
            appliedCoupon = couponRepository.findByCode(paymentDTO.getCouponCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không tồn tại"));
            if (appliedCoupon.isUsed()) {
                throw new IllegalArgumentException("Mã giảm giá này đã được sử dụng");
            }
            if (appliedCoupon.getUser() == null || !appliedCoupon.getUser().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Mã giảm giá không khả dụng cho tài khoản này");
            }
            appliedCoupon.setUsed(true);
            couponRepository.save(appliedCoupon);
        }

        Order order = Order.builder()
                .user(user)
                .totalAmount(amount)
                .platformFee(platformFee)
                .status(OrderStatus.PENDING)
                .purchaseDate(LocalDateTime.now())
                .paymentMethod(paymentDTO.getPaymentMethod() != null ? paymentDTO.getPaymentMethod() : "vnpay")
                .appliedCoupon(appliedCoupon)
                .build();

        order = orderRepository.save(order);
        order.setQrCode(java.util.UUID.randomUUID().toString().replace("-", "").toUpperCase());
        order = orderRepository.save(order);
        List<Ticket> newTickets = new ArrayList<>();

        for (Long seatId : paymentDTO.getSeatIds()) {
            Seat seat = seatRepository.findById(seatId)
                    .orElseThrow(() -> new IllegalArgumentException("Seat not found: " + seatId));

            if (seat.getStatus() != SeatStatus.AVAILABLE) {
                throw new IllegalArgumentException("Seat " + seat.getSeatNumber() + " is not available");
            }

            seat.setStatus(SeatStatus.PENDING);
            seatRepository.save(seat);

            Ticket ticket = Ticket.builder()
                    .user(user)
                    .seat(seat)
                    .status(TicketStatus.PENDING)
                    .purchaseDate(LocalDateTime.now())
                    .order(order)
                    .build();

            newTickets.add(ticketRepository.save(ticket));
        }
        order.setTickets(newTickets);

        // --- PAYMENT GATEWAY DIFFERENTIATION ---
        if ("momo".equalsIgnoreCase(paymentDTO.getPaymentMethod())) {
            // MoMo: Immediate success (Bypass for demo)
            order.setStatus(OrderStatus.COMPLETED);
            orderRepository.save(order);
            awardPoints(order);

            if (newTickets != null && !newTickets.isEmpty()) {
                com.pbl.pbl.entity.Event event = newTickets.get(0).getSeat().getEventSession().getEvent();
                if (event.getTicketsLeft() != null) {
                    event.setTicketsLeft(Math.max(0, event.getTicketsLeft() - newTickets.size()));
                    eventRepository.save(event);
                }
            }

            for (Ticket ticket : newTickets) {
                ticket.setStatus(TicketStatus.PAID);
                ticket.getSeat().setStatus(SeatStatus.BOOKED);
                ticketRepository.save(ticket);
                seatRepository.save(ticket.getSeat());
            }

            emailService.sendTicketEmail(order);

            String dummyTransactionId = "MOMO_" + System.currentTimeMillis();
            return "http://localhost:5173/payment-result?status=success&orderInfo=" + 
                   URLEncoder.encode(paymentDTO.getOrderInfo(), StandardCharsets.UTF_8) + 
                   "&transactionId=" + dummyTransactionId;
        } else {
            // VNPay: Redirect to FRONTEND sandbox instead of real gateway
            // Note: We don't mark as COMPLETED here. The sandbox will call back.
            String sandboxUrl = "http://localhost:5173/vnpay-sandbox";
            return sandboxUrl + "?txnRef=" + order.getId() + 
                   "&amount=" + paymentDTO.getAmount() + 
                   "&orderInfo=" + URLEncoder.encode(paymentDTO.getOrderInfo(), StandardCharsets.UTF_8);
        }
    }

    private String createMoMoPayment(PaymentDTO paymentDTO, Order order) throws Exception {
        String orderId = order.getId().toString();
        String amount = String.valueOf(paymentDTO.getAmount());
        String orderInfo = paymentDTO.getOrderInfo();
        String requestId = String.valueOf(System.currentTimeMillis());
        String extraData = "";

        // Standard MoMo Signature string
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

    private String createVNPayPayment(PaymentDTO paymentDTO, Order order, HttpServletRequest request) {
        long vnp_Amount = paymentDTO.getAmount() * 100L;
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", vnPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(vnp_Amount));
        vnp_Params.put("vnp_CurrCode", "VND");

        String bankCode = request.getParameter("bankCode");
        if (bankCode != null && !bankCode.isEmpty()) {
            vnp_Params.put("vnp_BankCode", bankCode);
        }

        vnp_Params.put("vnp_TxnRef", order.getId().toString());
        vnp_Params.put("vnp_OrderInfo", paymentDTO.getOrderInfo());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");

        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnPayConfig.getIpAddress(request));

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = vnPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        return vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
    }

    @Transactional
    public int orderReturn(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                fields.put(fieldName, fieldValue);
            }
        }

        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
        if (fields.containsKey("vnp_SecureHashType")) {
            fields.remove("vnp_SecureHashType");
        }
        if (fields.containsKey("vnp_SecureHash")) {
            fields.remove("vnp_SecureHash");
        }

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String signValue = vnPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        if (signValue.equals(vnp_SecureHash) || "MOCK_SANDBOX_HASH".equals(vnp_SecureHash)) {
            String vnp_TxnRef = request.getParameter("vnp_TxnRef");

            try {
                Optional<Order> orderOpt = orderRepository.findById(Long.valueOf(vnp_TxnRef));

                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();

                    if ("00".equals(request.getParameter("vnp_TransactionResponseCode"))) {
                        order.setStatus(OrderStatus.COMPLETED);
                        orderRepository.save(order);
                        awardPoints(order);

                        if (order.getTickets() != null && !order.getTickets().isEmpty()) {
                            com.pbl.pbl.entity.Event event = order.getTickets().get(0).getSeat().getEventSession().getEvent();
                            if (event.getTicketsLeft() != null) {
                                event.setTicketsLeft(Math.max(0, event.getTicketsLeft() - order.getTickets().size()));
                                eventRepository.save(event);
                            }
                        }

                        for (Ticket ticket : order.getTickets()) {
                            ticket.setStatus(TicketStatus.PAID);
                            ticket.getSeat().setStatus(SeatStatus.BOOKED);
                            ticketRepository.save(ticket);
                            seatRepository.save(ticket.getSeat());
                        }
                        emailService.sendTicketEmail(order);
                        return 1; // Success
                    } else {
                        order.setStatus(OrderStatus.CANCELLED);
                        if (order.getAppliedCoupon() != null) {
                            order.getAppliedCoupon().setUsed(false);
                            couponRepository.save(order.getAppliedCoupon());
                        }
                        orderRepository.save(order);
                        for (Ticket ticket : order.getTickets()) {
                            ticket.setStatus(TicketStatus.CANCELLED);
                            ticket.getSeat().setStatus(SeatStatus.AVAILABLE);
                            ticketRepository.save(ticket);
                            seatRepository.save(ticket.getSeat());
                        }
                        return 0; // Failed
                    }
                }
            } catch (NumberFormatException e) {
                return -1;
            }
            return -1;
        } else {
            return -2;
        }
    }

    @Transactional
    public int orderReturnMomo(HttpServletRequest request) {
        String partnerCode = request.getParameter("partnerCode");
        String orderId = request.getParameter("orderId");
        String requestId = request.getParameter("requestId");
        String amount = request.getParameter("amount");
        String orderInfo = request.getParameter("orderInfo");
        String orderType = request.getParameter("orderType");
        String transId = request.getParameter("transId");
        String resultCode = request.getParameter("resultCode");
        String message = request.getParameter("message");
        String payType = request.getParameter("payType");
        String responseTime = request.getParameter("responseTime");
        String extraData = request.getParameter("extraData");
        String signature = request.getParameter("signature");

        String rawHash = "accessKey=" + moMoConfig.getAccessKey() +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&message=" + message +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&orderType=" + orderType +
                "&partnerCode=" + partnerCode +
                "&payType=" + payType +
                "&requestId=" + requestId +
                "&responseTime=" + responseTime +
                "&resultCode=" + resultCode +
                "&transId=" + transId;

        String signValue = moMoConfig.hmacSHA256(rawHash);

        if (signValue.equals(signature)) {
            try {
                Optional<Order> orderOpt = orderRepository.findById(Long.valueOf(orderId));

                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();

                    if ("0".equals(resultCode)) {
                        order.setStatus(OrderStatus.COMPLETED);
                        orderRepository.save(order);
                        awardPoints(order);

                        if (order.getTickets() != null && !order.getTickets().isEmpty()) {
                            com.pbl.pbl.entity.Event event = order.getTickets().get(0).getSeat().getEventSession().getEvent();
                            if (event.getTicketsLeft() != null) {
                                event.setTicketsLeft(Math.max(0, event.getTicketsLeft() - order.getTickets().size()));
                                eventRepository.save(event);
                            }
                        }

                        for (Ticket ticket : order.getTickets()) {
                            ticket.setStatus(TicketStatus.PAID);
                            ticket.getSeat().setStatus(SeatStatus.BOOKED);
                            ticketRepository.save(ticket);
                            seatRepository.save(ticket.getSeat());
                        }
                        emailService.sendTicketEmail(order);
                        return 1; // Success
                    } else {
                        order.setStatus(OrderStatus.CANCELLED);
                        if (order.getAppliedCoupon() != null) {
                            order.getAppliedCoupon().setUsed(false);
                            couponRepository.save(order.getAppliedCoupon());
                        }
                        orderRepository.save(order);
                        for (Ticket ticket : order.getTickets()) {
                            ticket.setStatus(TicketStatus.CANCELLED);
                            ticket.getSeat().setStatus(SeatStatus.AVAILABLE);
                            ticketRepository.save(ticket);
                            seatRepository.save(ticket.getSeat());
                        }
                        return 0; // Failed
                    }
                }
                return -1;
            } catch (NumberFormatException e) {
                return -1;
            }
        } else {
            return -2; // Signature fail
        }
    }

    private void awardPoints(Order order) {
        User user = order.getUser();
        if (user != null) {
            // Award 1% of the total amount as points
            long pointsToAward = order.getTotalAmount().multiply(new BigDecimal("0.01")).longValue();
            user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0L) + pointsToAward);
            userRepository.save(user);
        }
    }
}
