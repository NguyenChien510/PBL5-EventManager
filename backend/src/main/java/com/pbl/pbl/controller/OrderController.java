package com.pbl.pbl.controller;

import com.pbl.pbl.dto.OrderDTO;
import com.pbl.pbl.entity.Order;
import com.pbl.pbl.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        List<OrderDTO> dtos = orders.stream()
                .sorted(Comparator.comparing(Order::getPurchaseDate).reversed())
                .map(order -> {
                    var firstTicket = order.getTickets().isEmpty() ? null : order.getTickets().get(0);
                    var mainSeat = (firstTicket != null) ? firstTicket.getSeat() : null;
                    var mainSession = (mainSeat != null) ? mainSeat.getEventSession() : null;
                    var mainEvent = (mainSession != null) ? mainSession.getEvent() : null;

                    return OrderDTO.builder()
                        .id(order.getId())
                        .userEmail(order.getUser() != null ? order.getUser().getEmail() : "Unknown")
                        .userName(order.getUser() != null ? order.getUser().getFullName() : "Unknown")
                        .totalAmount(order.getTotalAmount())
                        .platformFee(order.getPlatformFee())
                        .status(order.getStatus() != null ? order.getStatus().name() : "PENDING")
                        .paymentMethod(order.getPaymentMethod())
                        .purchaseDate(order.getPurchaseDate())
                        .eventId(mainEvent != null ? mainEvent.getId() : null)
                        .eventTitle(mainEvent != null ? mainEvent.getTitle() : "Unknown Event")
                        .eventPosterUrl(mainEvent != null ? mainEvent.getPosterUrl() : null)
                        .eventSessionId(mainSession != null ? mainSession.getId() : null)
                        .tickets(order.getTickets().stream()
                                .map(ticket -> {
                                    var seat = ticket.getSeat();
                                    var session = (seat != null) ? seat.getEventSession() : null;
                                    var event = (session != null) ? session.getEvent() : null;
                                    var type = (seat != null) ? seat.getTicketType() : null;

                                    return OrderDTO.TicketDetailDTO.builder()
                                            .id(ticket.getId())
                                            .eventTitle(event != null ? event.getTitle() : "Unknown Event")
                                            .seatNumber(seat != null ? seat.getSeatNumber() : "N/A")
                                            .price(type != null ? type.getPrice() : java.math.BigDecimal.ZERO)
                                            .sessionName(session != null ? session.getName() : "N/A")
                                            .seatId(seat != null ? seat.getId() : null)
                                            .build();
                                })
                                .collect(Collectors.toList()))
                        .build();
                })
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(dtos);
    }
}
