package com.pbl.pbl.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import com.pbl.pbl.dto.CommentDTO;
import com.pbl.pbl.entity.Comment;
import com.pbl.pbl.repository.CommentRepository;
import com.pbl.pbl.repository.EventRepository;
import com.pbl.pbl.repository.UserRepository;
import com.pbl.pbl.mapper.UserMapper;
import lombok.RequiredArgsConstructor;

@Service
public class CommentService {
    private final CommentRepository commentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @org.springframework.beans.factory.annotation.Autowired
    public CommentService(
            CommentRepository commentRepository,
            EventRepository eventRepository,
            UserRepository userRepository,
            UserMapper userMapper) {
        this.commentRepository = commentRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByEvent(Long eventId) {
        return commentRepository.findByEventIdOrderByCreatedAtDesc(eventId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByOrganizer(java.util.UUID organizerId) {
        return commentRepository.findByEventOrganizerIdOrderByCreatedAtDesc(organizerId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.pbl.pbl.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return commentRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CommentDTO createComment(CommentDTO dto) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.pbl.pbl.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        com.pbl.pbl.entity.Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        Comment comment = Comment.builder()
                .user(user)
                .event(event)
                .content(dto.getContent())
                .rating(dto.getRating())
                .images(dto.getImages() != null ? String.join(",", dto.getImages()) : null)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        comment = commentRepository.save(comment);
        return convertToDTO(comment);
    }

    public CommentDTO replyToComment(Long commentId, String replyContent) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        // In a real app, verify that the current user is the organizer of the event
        comment.setReply(replyContent);
        comment = commentRepository.save(comment);
        return convertToDTO(comment);
    }

    private CommentDTO convertToDTO(Comment comment) {
        return CommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .rating(comment.getRating())
                .createdAt(comment.getCreatedAt())
                .eventId(comment.getEvent().getId())
                .eventName(comment.getEvent().getTitle())
                .eventThumbnail(comment.getEvent().getPosterUrl())
                .images(comment.getImages() != null ? java.util.Arrays.asList(comment.getImages().split(",")) : java.util.Collections.emptyList())
                .user(userMapper.toDto(comment.getUser()))
                .reply(comment.getReply())
                .build();
    }
}
