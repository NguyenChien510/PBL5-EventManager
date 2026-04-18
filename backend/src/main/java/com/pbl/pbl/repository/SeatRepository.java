package com.pbl.pbl.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.Seat;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    java.util.List<Seat> findByEventSession_Event_Id(Long eventId);
    java.util.List<Seat> findByEventSessionId(Long sessionId);
    long countByEventSession_Event_IdAndStatus(Long eventId, com.pbl.pbl.entity.SeatStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) FROM Seat s WHERE s.eventSession.event.organizer.id = :organizerId AND s.status = com.pbl.pbl.entity.SeatStatus.BOOKED")
    long countByOrganizerIdAndStatus(@org.springframework.data.repository.query.Param("organizerId") java.util.UUID organizerId);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(s.ticketType.price) FROM Seat s WHERE s.eventSession.event.organizer.id = :organizerId AND s.status = com.pbl.pbl.entity.SeatStatus.BOOKED")
    java.math.BigDecimal sumRevenueByOrganizerIdAndStatus(@org.springframework.data.repository.query.Param("organizerId") java.util.UUID organizerId);
}
