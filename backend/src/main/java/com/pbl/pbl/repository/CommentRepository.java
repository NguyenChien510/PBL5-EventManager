package com.pbl.pbl.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.pbl.pbl.entity.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByEventIdOrderByCreatedAtDesc(Long eventId);
    List<Comment> findByEventId(Long eventId);
    
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c JOIN FETCH c.user JOIN FETCH c.event WHERE c.event.organizer.id = :organizerId ORDER BY c.createdAt DESC")
    List<Comment> findByEventOrganizerIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("organizerId") java.util.UUID organizerId);
    
    List<Comment> findByUserId(java.util.UUID userId);
}
