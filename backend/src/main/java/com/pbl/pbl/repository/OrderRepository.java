package com.pbl.pbl.repository;

import com.pbl.pbl.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserId(UUID userId);

    @Query("SELECT o FROM Order o WHERE EXISTS (SELECT t FROM Ticket t WHERE t.order = o AND t.seat.eventSession.event.organizer.id = :organizerId)")
    List<Order> findByOrganizerId(@Param("organizerId") UUID organizerId);
}
