package com.pbl.pbl.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.pbl.pbl.entity.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByEventIdOrderByCreatedAtDesc(Long eventId);
    List<Comment> findByEventId(Long eventId);
    List<Comment> findByEventOrganizerIdOrderByCreatedAtDesc(java.util.UUID organizerId);
}
