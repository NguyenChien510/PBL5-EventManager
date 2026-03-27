package com.pbl.pbl.repository;

import java.math.BigDecimal;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.TicketType;

@Repository
public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {
    @Query("select min(tt.price) from TicketType tt where tt.eventSession.event.id = :eventId")
    BigDecimal findMinPriceByEventId(@Param("eventId") Long eventId);

    @Query("select max(tt.price) from TicketType tt where tt.eventSession.event.id = :eventId")
    BigDecimal findMaxPriceByEventId(@Param("eventId") Long eventId);
}
