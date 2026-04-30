package com.pbl.pbl.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.Event;
import com.pbl.pbl.entity.EventStatus;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @EntityGraph(attributePaths = { "category", "province", "organizer" })
    List<Event> findByStatusOrderByStartTimeAsc(EventStatus status);

    @EntityGraph(attributePaths = { "category", "province", "organizer" })
    List<Event> findAllByOrderByStartTimeDesc();

    @EntityGraph(attributePaths = { "category", "province", "organizer" })
    org.springframework.data.domain.Page<Event> findAll(org.springframework.data.domain.Pageable pageable);

    @EntityGraph(attributePaths = { "category", "province", "organizer" })
    org.springframework.data.domain.Page<Event> findByOrganizer_Id(java.util.UUID organizerId, org.springframework.data.domain.Pageable pageable);

    @EntityGraph(attributePaths = { "category", "province", "organizer" })
    org.springframework.data.domain.Page<Event> findByOrganizer_IdAndStatus(java.util.UUID organizerId, EventStatus status, org.springframework.data.domain.Pageable pageable);

    @EntityGraph(attributePaths = { "category", "province", "organizer" })
    long countByOrganizer_Id(java.util.UUID organizerId);

    @EntityGraph(attributePaths = { "category", "province", "organizer" })
    org.springframework.data.domain.Page<Event> findByStatusIn(java.util.List<EventStatus> statuses, org.springframework.data.domain.Pageable pageable);

    long countByStatus(EventStatus status);

    
    long countByStatusIn(java.util.List<EventStatus> statuses);

    long countByOrganizer_IdAndStatus(java.util.UUID organizerId, EventStatus status);
}


