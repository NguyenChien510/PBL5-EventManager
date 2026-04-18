package com.pbl.pbl.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.Ticket;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    java.util.List<Ticket> findByUser_Id(java.util.UUID userId);
    java.util.List<Ticket> findBySeat_EventSession_Event_Id(Long eventId);
}
