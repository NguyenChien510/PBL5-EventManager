package com.pbl.pbl.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import com.pbl.pbl.dto.CommentDTO;
import com.pbl.pbl.entity.Comment;
import com.pbl.pbl.repository.CommentRepository;
import com.pbl.pbl.repository.EventRepository;
import com.pbl.pbl.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public List<CommentDTO> getCommentsByEvent(Long eventId) {
        return commentRepository.findByEventIdOrderByCreatedAtDesc(eventId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CommentDTO> getCommentsByOrganizer(java.util.UUID organizerId) {
        return commentRepository.findByEventOrganizerIdOrderByCreatedAtDesc(organizerId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CommentDTO> getCommentsByCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.pbl.pbl.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return commentRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private CommentDTO convertToDTO(Comment comment) {
        return CommentDTO.builder()
                .id(comment.getId())
                .userName(comment.getUser().getFullName())
                .userEmail(comment.getUser().getEmail())
                .content(comment.getContent())
                .rating(comment.getRating())
                .createdAt(comment.getCreatedAt())
                .eventId(comment.getEvent().getId())
                .build();
    }
}
