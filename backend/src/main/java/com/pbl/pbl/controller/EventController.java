package com.pbl.pbl.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;

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
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
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
}
