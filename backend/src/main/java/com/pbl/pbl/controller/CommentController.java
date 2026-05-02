package com.pbl.pbl.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.pbl.pbl.dto.CommentDTO;
import com.pbl.pbl.service.CommentService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@org.springframework.web.bind.annotation.CrossOrigin
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<CommentDTO>> getEventComments(@PathVariable Long eventId) {
        return ResponseEntity.ok(commentService.getCommentsByEvent(eventId));
    }

    @GetMapping("/organizer/{organizerId}")
    public ResponseEntity<List<CommentDTO>> getOrganizerComments(@PathVariable java.util.UUID organizerId) {
        return ResponseEntity.ok(commentService.getCommentsByOrganizer(organizerId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CommentDTO>> getMyComments() {
        return ResponseEntity.ok(commentService.getCommentsByCurrentUser());
    }

    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<CommentDTO> createComment(@org.springframework.web.bind.annotation.RequestBody CommentDTO dto) {
        return ResponseEntity.ok(commentService.createComment(dto));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{commentId}/reply")
    public ResponseEntity<CommentDTO> replyToComment(@PathVariable Long commentId, @org.springframework.web.bind.annotation.RequestBody String reply) {
        return ResponseEntity.ok(commentService.replyToComment(commentId, reply));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{commentId}/toggle-like")
    public ResponseEntity<CommentDTO> toggleLike(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.toggleLike(commentId));
    }
}
