package com.pbl.pbl.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.pbl.pbl.dto.EventRequestDTO;
import com.pbl.pbl.entity.Event;
import com.pbl.pbl.service.EventService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody EventRequestDTO request) {
        System.out.println(">>> CREATE EVENT REQUEST RECEIVED: " + request.getTitle());
        return ResponseEntity.ok(eventService.createEvent(request));
    }
}
