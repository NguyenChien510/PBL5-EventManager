package com.pbl.pbl.controller;

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
import com.pbl.pbl.entity.TicketStatus;
import com.pbl.pbl.service.EventService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/organizer")
@RequiredArgsConstructor
public class OrganizerManagementController {

    private final EventService eventService;

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
}
