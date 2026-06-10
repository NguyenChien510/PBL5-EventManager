package com.pbl.pbl.service;

import com.pbl.pbl.dto.*;
import com.pbl.pbl.entity.Event;
import com.pbl.pbl.entity.EventStatus;
import com.pbl.pbl.entity.TicketStatus;
import com.pbl.pbl.entity.User;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface IEventService {
    List<EventResponseDTO> getUpcomingEvents();
    Event getEventById(Long id);
    List<EventResponseDTO> getAllEventsForAdmin();
    AdminEventListResponseDTO getAllEventsForAdminPaginated(Pageable pageable, List<EventStatus> statuses, String keyword);
    OrganizerDashboardResponseDTO getOrganizerDashboardData(UUID organizerId, EventStatus status, String keyword, Pageable pageable);
    EventResponseDTO getEventResponseById(Long id);
    EventResponseDTO updateEventStatus(Long id, EventStatus status, String rejectReason);
    EventResponseDTO resubmitEvent(Long id, UUID organizerId);
    List<TicketTypeResponseDTO> getTicketTypesByEventId(Long eventId);
    List<SeatResponseDTO> getSeatsByEventId(Long eventId);
    List<SeatResponseDTO> getSeatsBySessionId(Long sessionId);
    List<UpcomingEventCardDTO> getUpcomingEventsForHomepage();
    List<UpcomingEventCardDTO> searchEvents(String keyword, Long categoryId, String province, BigDecimal minPrice, BigDecimal maxPrice, String dateFilter, String sortBy);
    EventResponseDTO createEvent(EventRequestDTO request, User organizer);
    List<EventAttendeeDTO> getEventAttendees(Long eventId);
    EventManagementStatsDTO getEventManagementStats(Long eventId);
    void updateTicketStatus(Long ticketId, TicketStatus status);
    void checkInByOrderQR(String qrCode);
    void checkInOrderByOrderId(Long orderId);
    OrderDTO getOrderByQR(String qrCode);
    OrderDTO convertToOrderDTO(com.pbl.pbl.entity.Order order);
}
