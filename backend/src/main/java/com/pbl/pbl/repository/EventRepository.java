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
}
