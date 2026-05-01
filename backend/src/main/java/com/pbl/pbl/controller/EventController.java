package com.pbl.pbl.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;


import com.pbl.pbl.dto.EventRequestDTO;
import com.pbl.pbl.dto.UpcomingEventCardDTO;
import com.pbl.pbl.entity.Event;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.repository.UserRepository;
import com.pbl.pbl.service.EventService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin
public class EventController {

    private final EventService eventService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication auth) {
        if (auth == null) return null;
        String email = auth.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<java.util.List<Event>> getUpcomingEvents() {
        return ResponseEntity.ok(eventService.getUpcomingEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<com.pbl.pbl.dto.EventResponseDTO> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventResponseById(id));
    }

    @GetMapping("/{id}/ticket-types")
    public ResponseEntity<java.util.List<com.pbl.pbl.dto.TicketTypeResponseDTO>> getTicketTypesByEventId(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getTicketTypesByEventId(id));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<java.util.List<com.pbl.pbl.dto.SeatResponseDTO>> getSeatsByEventId(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getSeatsByEventId(id));
    }

    @GetMapping("/sessions/{id}/seats")
    public ResponseEntity<java.util.List<com.pbl.pbl.dto.SeatResponseDTO>> getSeatsBySessionId(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getSeatsBySessionId(id));
    }

    @GetMapping("/search")
    public ResponseEntity<java.util.List<UpcomingEventCardDTO>> searchEvents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) String dateFilter,
            @RequestParam(required = false) String sortBy) {
        return ResponseEntity.ok(eventService.searchEvents(keyword, categoryId, province, minPrice, maxPrice, dateFilter, sortBy));
    }

    @GetMapping("/upcoming-card-data")
    public ResponseEntity<java.util.List<UpcomingEventCardDTO>> getUpcomingCardData() {
        return ResponseEntity.ok(eventService.getUpcomingEventsForHomepage());
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody EventRequestDTO request, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        String role = user.getRole().getName().toUpperCase();
        if (!role.contains("ORGANIZER") && !role.contains("ADMIN")) {
            return ResponseEntity.status(403).body("Only organizers or admins can create events");
        }

        System.out.println(">>> CREATE EVENT REQUEST BY: " + user.getEmail());
        return ResponseEntity.ok(eventService.createEvent(request, user));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<com.pbl.pbl.dto.AdminEventListResponseDTO> getAllEventsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) java.util.List<com.pbl.pbl.entity.EventStatus> statuses) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        return ResponseEntity.ok(eventService.getAllEventsForAdminPaginated(pageable, statuses));
    }

    @GetMapping("/organizer/dashboard")
    public ResponseEntity<?> getOrganizerDashboard(
            Authentication auth,
            @RequestParam(required = false) com.pbl.pbl.entity.EventStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (auth != null) {
            System.out.println(">>> DASHBOARD REQUESTED BY: " + auth.getName());
            System.out.println(">>> AUTHORITIES: " + auth.getAuthorities());
        }

        User user = getCurrentUser(auth);
        if (user == null) {
            System.err.println(">>> DASHBOARD ACCESS DENIED: USER NOT FOUND FOR EMAIL " + (auth != null ? auth.getName() : "NULL"));
            return ResponseEntity.status(401).body("Unauthorized");
        }

        System.out.println(">>> USER ROLE FROM DB: " + user.getRole().getName());
        System.out.println(">>> DASHBOARD REQUESTED FOR USER ID: " + user.getId() + " STATUS: " + status);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        com.pbl.pbl.dto.OrganizerDashboardResponseDTO data = eventService.getOrganizerDashboardData(user.getId(), status, pageable);
        
        System.out.println(">>> EVENTS FOUND FOR USER: " + data.getTotalEvents());
        return ResponseEntity.ok(data);
    }





    @PatchMapping("/admin/{id}/status")
    public ResponseEntity<Event> updateEventStatus(@PathVariable Long id, @RequestParam com.pbl.pbl.entity.EventStatus status, @RequestParam(required = false) String rejectReason) {
        return ResponseEntity.ok(eventService.updateEventStatus(id, status, rejectReason));
    }

    @PatchMapping("/organizer/{id}/resubmit")
    public ResponseEntity<?> resubmitEvent(@PathVariable Long id, Authentication auth) {
        User user = getCurrentUser(auth);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        return ResponseEntity.ok(eventService.resubmitEvent(id, user.getId()));
    }
}
