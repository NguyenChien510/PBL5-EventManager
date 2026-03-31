package com.pbl.pbl.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.EventStatus;
import com.pbl.pbl.entity.TicketType;

@Repository
public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {

    /**
     * One query for all min/max prices per event (avoids N+1 when listing homepage cards).
     */
    @Query("select es.event.id, min(tt.price), max(tt.price), sum(tt.totalQuantity) from TicketType tt join tt.eventSession es "
            + "where es.event.status = :status group by es.event.id")
    List<Object[]> findMinMaxPriceGroupedByEventStatus(@Param("status") EventStatus status);

    List<TicketType> findByEventSession_Event_Id(Long eventId);
}
