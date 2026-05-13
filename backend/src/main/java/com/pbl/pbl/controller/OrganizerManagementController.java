package com.pbl.pbl.controller;

// Organizer Management Controller
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pbl.pbl.dto.EventAttendeeDTO;
import com.pbl.pbl.dto.EventManagementStatsDTO;
import com.pbl.pbl.dto.OrderDTO;
import com.pbl.pbl.entity.Order;
import com.pbl.pbl.entity.TicketStatus;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.repository.OrderRepository;
import com.pbl.pbl.repository.UserRepository;
import com.pbl.pbl.service.EventService;
import org.springframework.security.core.Authentication;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.TreeMap;
import java.time.Month;
import java.util.ArrayList;
import java.math.BigDecimal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/organizer")
@RequiredArgsConstructor
public class OrganizerManagementController {

    private final EventService eventService;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @GetMapping("/events/{id}/manage/stats")
    public ResponseEntity<EventManagementStatsDTO> getEventManageStats(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventManagementStats(id));
    }

    @GetMapping("/events/{id}/manage/attendees")
    public ResponseEntity<List<EventAttendeeDTO>> getEventAttendees(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventAttendees(id));
    }

    @PatchMapping("/tickets/{ticketId}/check-in")
    public ResponseEntity<?> checkInTicket(@PathVariable Long ticketId, @RequestParam boolean checkedIn) {
        TicketStatus status = checkedIn ? TicketStatus.CHECKED_IN : TicketStatus.PAID;
        eventService.updateTicketStatus(ticketId, status);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/orders/{orderId}/check-in")
    public ResponseEntity<?> checkInOrder(@PathVariable Long orderId) {
        eventService.checkInOrderByOrderId(orderId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/orders/check-in-by-qr")
    public ResponseEntity<?> checkInOrderByQR(@RequestParam String qrCode) {
        eventService.checkInByOrderQR(qrCode);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/orders/info-by-qr")
    public ResponseEntity<OrderDTO> getOrderByQR(@RequestParam String qrCode) {
        return ResponseEntity.ok(eventService.getOrderByQR(qrCode));
    }

    @GetMapping("/events/{id}/manage/orders")
    public ResponseEntity<List<OrderDTO>> getEventOrders(@PathVariable Long id) {
        List<Order> orders = orderRepository.findOrdersWithDetailsByEventId(id);
        List<OrderDTO> dtos = orders.stream()
                .sorted(Comparator.comparing(Order::getPurchaseDate).reversed())
                .map(eventService::convertToOrderDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/finance/transactions")
    public ResponseEntity<List<OrderDTO>> getOrganizerTransactions(Authentication authentication) {
        String email = authentication.getName();
        User organizer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        List<Order> orders = orderRepository.findOrdersWithDetailsByOrganizerId(organizer.getId());
        List<OrderDTO> dtos = orders.stream()
                .sorted(Comparator.comparing(Order::getPurchaseDate).reversed())
                .map(eventService::convertToOrderDTO)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/finance/stats")
    public ResponseEntity<List<BigDecimal>> getOrganizerFinanceStats(Authentication authentication) {
        String email = authentication.getName();
        User organizer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        List<Order> orders = orderRepository.findByOrganizerId(organizer.getId());
        
        // Map to store revenue by month (1-12)
        Map<Integer, BigDecimal> monthlyRevenue = new TreeMap<>();
        for (int i = 1; i <= 12; i++) {
            monthlyRevenue.put(i, BigDecimal.ZERO);
        }

        int currentYear = java.time.LocalDate.now().getYear();

        orders.stream()
            .filter(o -> "COMPLETED".equals(o.getStatus().toString()))
            .filter(o -> o.getPurchaseDate().getYear() == currentYear)
            .forEach(o -> {
                int month = o.getPurchaseDate().getMonthValue();
                monthlyRevenue.put(month, monthlyRevenue.get(month).add(o.getTotalAmount()));
            });

        return ResponseEntity.ok(new ArrayList<>(monthlyRevenue.values()));
    }
}
