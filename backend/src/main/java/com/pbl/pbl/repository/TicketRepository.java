package com.pbl.pbl.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.Ticket;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    java.util.List<Ticket> findByUser_Id(java.util.UUID userId);
    @org.springframework.data.jpa.repository.Query("SELECT t FROM Ticket t " +
           "JOIN FETCH t.user " +
           "JOIN FETCH t.seat s " +
           "JOIN FETCH s.ticketType " +
           "LEFT JOIN FETCH t.order " +
           "WHERE s.eventSession.event.id = :eventId")
    java.util.List<Ticket> findByEventIdWithDetails(Long eventId);
}
