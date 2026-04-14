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

import com.pbl.pbl.dto.EventRequestDTO;
import com.pbl.pbl.dto.UpcomingEventCardDTO;
import com.pbl.pbl.entity.Event;
import com.pbl.pbl.service.EventService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin
public class EventController {

    private final EventService eventService;

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
    public ResponseEntity<Event> createEvent(@RequestBody EventRequestDTO request) {
        System.out.println(">>> CREATE EVENT REQUEST RECEIVED: " + request.getTitle());
        return ResponseEntity.ok(eventService.createEvent(request));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<java.util.List<com.pbl.pbl.dto.EventResponseDTO>> getAllEventsForAdmin() {
        return ResponseEntity.ok(eventService.getAllEventsForAdmin());
    }

    @PatchMapping("/admin/{id}/status")
    public ResponseEntity<Event> updateEventStatus(@PathVariable Long id, @RequestParam com.pbl.pbl.entity.EventStatus status) {
        return ResponseEntity.ok(eventService.updateEventStatus(id, status));
    }
}
