package com.pbl.pbl.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.Ticket;
import com.pbl.pbl.entity.TicketStatus;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT COUNT(DISTINCT s.eventSession.event.id) FROM Ticket t JOIN t.seat s "
            + "WHERE t.user.id = :userId AND t.status = :status")
    long countDistinctEventsAttended(@Param("userId") UUID userId, @Param("status") TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.user.id = :userId AND t.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") TicketStatus status);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.seat s JOIN FETCH s.eventSession es JOIN FETCH es.event e "
            + "JOIN FETCH s.ticketType WHERE t.user.id = :userId AND t.status = :status "
            + "ORDER BY t.purchaseDate DESC")
    List<Ticket> findRecentByUser(@Param("userId") UUID userId, @Param("status") TicketStatus status,
            Pageable pageable);
}
