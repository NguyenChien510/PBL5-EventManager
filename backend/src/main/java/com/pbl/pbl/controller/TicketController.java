package com.pbl.pbl.controller;

import com.pbl.pbl.dto.TicketResponseDTO;
import com.pbl.pbl.entity.Order;
import com.pbl.pbl.entity.Ticket;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.repository.TicketRepository;
import com.pbl.pbl.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponseDTO>> getMyTickets() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Ticket> tickets = ticketRepository.findByUserIdWithDetails(user.getId());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm, dd 'Th'MM");

        List<TicketResponseDTO> dtos = tickets.stream().map(ticket -> {
            var seat = ticket.getSeat();
            var session = seat.getEventSession();
            var event = session.getEvent();
            var startDateTime = LocalDateTime.of(session.getSessionDate(), session.getStartTime());
            
            return TicketResponseDTO.builder()
                    .id(ticket.getId())
                    .image(event.getPosterUrl())
                    .title(event.getTitle())
                    .ticketId("#E-TICKET-" + ticket.getId())
                    .date(startDateTime.format(formatter))
                    .seat(seat.getSeatNumber())
                    .location(event.getLocation() != null ? event.getLocation() : "N/A")
                    .type(seat.getTicketType() != null ? seat.getTicketType().getName() : "Standard")
                    .status(ticket.getStatus().name().toLowerCase())
                    .orderQrCode(ticket.getOrder() != null ? ticket.getOrder().getQrCode() : null)
                    .orderId(ticket.getOrder() != null ? ticket.getOrder().getId() : null)
                    .eventId(event.getId())
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/statuses")
    public ResponseEntity<List<String>> getStatuses() {
        return ResponseEntity.ok(List.of("Tất cả", "Thanh toán thành công", "Đã check-in"));
    }
}
