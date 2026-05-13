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

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.tickets t LEFT JOIN FETCH t.seat s LEFT JOIN FETCH s.ticketType LEFT JOIN FETCH s.eventSession es LEFT JOIN FETCH es.event e WHERE e.organizer.id = :organizerId")
    List<Order> findOrdersWithDetailsByOrganizerId(@Param("organizerId") UUID organizerId);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.tickets t LEFT JOIN FETCH t.seat s LEFT JOIN FETCH s.ticketType LEFT JOIN FETCH s.eventSession es LEFT JOIN FETCH es.event e WHERE e.id = :eventId")
    List<Order> findOrdersWithDetailsByEventId(@Param("eventId") Long eventId);
    java.util.Optional<Order> findByQrCode(String qrCode);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.tickets t LEFT JOIN FETCH t.seat s LEFT JOIN FETCH s.ticketType LEFT JOIN FETCH s.eventSession es LEFT JOIN FETCH es.event e WHERE o.qrCode = :qrCode")
    java.util.Optional<Order> findWithDetailsByQrCode(@Param("qrCode") String qrCode);

    @Query(value = "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.tickets t LEFT JOIN FETCH t.seat s LEFT JOIN FETCH s.ticketType LEFT JOIN FETCH s.eventSession es LEFT JOIN FETCH es.event WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(o.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "CAST(o.id as string) LIKE CONCAT('%', :keyword, '%'))",
           countQuery = "SELECT COUNT(DISTINCT o) FROM Order o LEFT JOIN o.user WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(o.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "CAST(o.id as string) LIKE CONCAT('%', :keyword, '%'))")
    org.springframework.data.domain.Page<Order> searchOrders(@Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    @Query(value = "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.tickets t LEFT JOIN FETCH t.seat s LEFT JOIN FETCH s.ticketType LEFT JOIN FETCH s.eventSession es LEFT JOIN FETCH es.event",
           countQuery = "SELECT COUNT(o) FROM Order o")
    org.springframework.data.domain.Page<Order> findAllWithDetails(org.springframework.data.domain.Pageable pageable);
}
