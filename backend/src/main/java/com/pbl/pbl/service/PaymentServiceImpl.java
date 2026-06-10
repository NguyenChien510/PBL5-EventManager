package com.pbl.pbl.service;

import com.pbl.pbl.config.VNPayConfig;
import com.pbl.pbl.config.MoMoConfig;
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
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements IPaymentService {
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendBaseUrl;

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

    private final Map<String, PaymentGateway> paymentGateways;

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
                    .orElse("10");
            BigDecimal taxRate = new BigDecimal(taxRateStr);
            
            platformFee = amount.multiply(taxRate).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        }

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

        // Polymorphic dispatch via Strategy pattern
        String method = paymentDTO.getPaymentMethod() != null ? paymentDTO.getPaymentMethod().toLowerCase() : "vnpay";
        PaymentGateway gateway = paymentGateways.get(method);
        if (gateway == null) {
            throw new IllegalArgumentException("Unsupported payment method: " + paymentDTO.getPaymentMethod());
        }
        return gateway.process(paymentDTO, order, request);
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
                        return 1;
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
                        return 0;
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
                        return 1;
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
                        return 0;
                    }
                }
                return -1;
            } catch (NumberFormatException e) {
                return -1;
            }
        } else {
            return -2;
        }
    }

    private void awardPoints(Order order) {
        User user = order.getUser();
        if (user != null) {
            long pointsToAward = order.getTotalAmount().multiply(new BigDecimal("0.01")).longValue();
            user.addLoyaltyPoints(pointsToAward);
            userRepository.save(user);
        }
    }
}
