package com.pbl.pbl.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl.pbl.dto.EventRequestDTO;
import com.pbl.pbl.dto.EventSessionRequestDTO;
import com.pbl.pbl.dto.TicketTypeRequestDTO;
import com.pbl.pbl.dto.UpcomingEventCardDTO;
import com.pbl.pbl.entity.Category;
import com.pbl.pbl.entity.Event;
import com.pbl.pbl.entity.EventSession;
import com.pbl.pbl.entity.EventStatus;
import com.pbl.pbl.entity.Province;
import com.pbl.pbl.entity.Seat;
import com.pbl.pbl.entity.SeatStatus;
import com.pbl.pbl.entity.TicketType;
import com.pbl.pbl.entity.Ward;
import com.pbl.pbl.repository.CategoryRepository;
import com.pbl.pbl.repository.EventRepository;
import com.pbl.pbl.repository.EventSessionRepository;
import com.pbl.pbl.repository.ProvinceRepository;
import com.pbl.pbl.repository.SeatRepository;
import com.pbl.pbl.repository.TicketTypeRepository;
import com.pbl.pbl.repository.WardRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventSessionRepository eventSessionRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final SeatRepository seatRepository;
    private final CategoryRepository categoryRepository;
    private final ProvinceRepository provinceRepository;
    private final WardRepository wardRepository;

    @Transactional(readOnly = true)
    public List<Event> getUpcomingEvents() {
        return eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.upcoming);
    }

    @Transactional(readOnly = true)
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    @Transactional(readOnly = true)
    public List<com.pbl.pbl.dto.TicketTypeResponseDTO> getTicketTypesByEventId(Long eventId) {
        return ticketTypeRepository.findByEventSession_Event_Id(eventId)
            .stream()
            .map(tt -> com.pbl.pbl.dto.TicketTypeResponseDTO.builder()
                .id(tt.getId())
                .name(tt.getName())
                .price(tt.getPrice())
                .totalQuantity(tt.getTotalQuantity())
                .build())
            .toList();
    }

    @Transactional(readOnly = true)
    public List<com.pbl.pbl.dto.SeatResponseDTO> getSeatsByEventId(Long eventId) {
        return seatRepository.findByEventSession_Event_Id(eventId)
            .stream()
            .map(s -> com.pbl.pbl.dto.SeatResponseDTO.builder()
                .id(s.getId())
                .seatNumber(s.getSeatNumber())
                .status(s.getStatus().name())
                .ticketTypeName(s.getTicketType() != null ? s.getTicketType().getName() : "")
                .price(s.getTicketType() != null ? s.getTicketType().getPrice() : BigDecimal.ZERO)
                .build())
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UpcomingEventCardDTO> getUpcomingEventsForHomepage() {
        List<Event> events = eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.upcoming);
        Map<Long, BigDecimal[]> minMaxByEventId = new HashMap<>();
        for (Object[] row : ticketTypeRepository.findMinMaxPriceGroupedByEventStatus(EventStatus.upcoming)) {
            Long eventId = ((Number) row[0]).longValue();
            minMaxByEventId.put(eventId, new BigDecimal[] { (BigDecimal) row[1], (BigDecimal) row[2] });
        }

        List<UpcomingEventCardDTO> result = new ArrayList<>();
        for (Event event : events) {
            BigDecimal[] mm = minMaxByEventId.get(event.getId());
            result.add(
                UpcomingEventCardDTO.builder()
                    .id(event.getId())
                    .title(event.getTitle())
                    .location(event.getLocation())
                    .startTime(event.getStartTime())
                    .posterUrl(event.getPosterUrl())
                    .ticketsLeft(event.getTicketsLeft())
                    .totalTickets(event.getTotalTickets())
                    .status(event.getStatus())
                    .categoryName(event.getCategory() != null ? event.getCategory().getName() : null)
                    .categoryColor(event.getCategory() != null ? event.getCategory().getColor() : null)
                    .provinceName(event.getProvince() != null ? event.getProvince().getName() : null)
                    .minPrice(mm != null ? mm[0] : null)
                    .maxPrice(mm != null ? mm[1] : null)
                    .build()
            );
        }

        return result;
    }

    @Transactional
    public Event createEvent(EventRequestDTO request) {
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Category not found"));
        
        Province province = provinceRepository.findById(request.getProvinceId())
            .orElseThrow(() -> new RuntimeException("Province not found"));
            
        Ward ward = null;
        if (request.getWardId() != null) {
            ward = wardRepository.findById(request.getWardId())
                .orElse(null);
        }

        // Calculate outer time range
        LocalDateTime eventStart = request.getSessions().stream()
            .map(s -> LocalDateTime.of(s.getSessionDate(), s.getStartTime()))
            .min(LocalDateTime::compareTo).orElse(LocalDateTime.now());
        LocalDateTime eventEnd = request.getSessions().stream()
            .map(s -> LocalDateTime.of(s.getSessionDate(), s.getEndTime()))
            .max(LocalDateTime::compareTo).orElse(LocalDateTime.now());

        Event event = Event.builder()
            .title(request.getTitle())
            .category(category)
            .province(province)
            .ward(ward)
            .artists(request.getArtists())
            .description(request.getDescription())
            .location(request.getLocation())
            .startTime(eventStart)
            .endTime(eventEnd)
            .posterUrl(request.getPosterUrl())
            .status(EventStatus.pending)
            .build();

        event = eventRepository.save(event);

        for (EventSessionRequestDTO sessionReq : request.getSessions()) {
            EventSession session = EventSession.builder()
                .event(event)
                .sessionDate(sessionReq.getSessionDate())
                .startTime(sessionReq.getStartTime())
                .endTime(sessionReq.getEndTime())
                .name(sessionReq.getName())
                .build();
            
            session = eventSessionRepository.save(session);

            // Create TicketTypes for this session
            Map<String, TicketType> ticketTypeMap = new HashMap<>();
            for (TicketTypeRequestDTO ttReq : request.getTicketTypes()) {
                TicketType tt = TicketType.builder()
                    .eventSession(session)
                    .name(ttReq.getName())
                    .price(ttReq.getPrice())
                    .totalQuantity(ttReq.getTotalQuantity())
                    .build();
                tt = ticketTypeRepository.save(tt);
                ticketTypeMap.put(tt.getName(), tt);
            }

            // Generate Seats
            if (request.getSeatMapConfig() != null) {
                int rows = request.getSeatMapConfig().getRows();
                int seatsPerRow = request.getSeatMapConfig().getSeatsPerRow();

                for (int i = 0; i < rows; i++) {
                    String rowLetter = getRowLetter(i);
                    final int rowIndex = i + 1;
                    
                    // Match row to ticket type
                    String ticketTypeName = request.getSeatMapConfig().getRowAssignments().stream()
                        .filter(a -> a.getRowIndex() == rowIndex)
                        .map(a -> a.getTicketTypeName())
                        .findFirst()
                        .orElse(request.getTicketTypes().get(0).getName());

                    TicketType tt = ticketTypeMap.get(ticketTypeName);

                    for (int j = 1; j <= seatsPerRow; j++) {
                        String seatNumber = rowLetter + String.format("%02d", j);
                        Seat seat = Seat.builder()
                            .eventSession(session)
                            .ticketType(tt)
                            .seatNumber(seatNumber)
                            .status(SeatStatus.AVAILABLE)
                            .build();
                        seatRepository.save(seat);
                    }
                }
            }
        }
        
        // Finalize event summaries
        int totalTicketsCount = request.getTicketTypes().stream()
            .mapToInt(tt -> (tt.getTotalQuantity() != null ? tt.getTotalQuantity() : 0))
            .sum() * request.getSessions().size();
            
        event.setTotalTickets(totalTicketsCount);
        event.setTicketsLeft(totalTicketsCount);
        eventRepository.save(event);

        return event;
    }

    private String getRowLetter(int index) {
        StringBuilder row = new StringBuilder();
        while (index >= 0) {
            row.insert(0, (char) ('A' + (index % 26)));
            index = (index / 26) - 1;
        }
        return row.toString();
    }
}
