package com.pbl.pbl.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl.pbl.dto.AdminEventListResponseDTO;
import com.pbl.pbl.dto.EventAdminSummaryDTO;
import com.pbl.pbl.dto.EventRequestDTO;
import com.pbl.pbl.dto.EventResponseDTO;

import com.pbl.pbl.dto.EventSessionRequestDTO;
import com.pbl.pbl.dto.TicketTypeRequestDTO;
import com.pbl.pbl.dto.EventScheduleRequestDTO;
import com.pbl.pbl.dto.EventScheduleResponseDTO;
import com.pbl.pbl.dto.UpcomingEventCardDTO;
import com.pbl.pbl.entity.Category;
import com.pbl.pbl.entity.Event;
import com.pbl.pbl.entity.EventSession;
import com.pbl.pbl.entity.EventSchedule;
import com.pbl.pbl.entity.EventStatus;
import com.pbl.pbl.entity.Province;
import com.pbl.pbl.entity.Seat;
import com.pbl.pbl.entity.SeatStatus;
import com.pbl.pbl.entity.TicketType;
import com.pbl.pbl.entity.Ward;
import com.pbl.pbl.repository.CategoryRepository;
import com.pbl.pbl.repository.EventRepository;
import com.pbl.pbl.repository.EventSessionRepository;
import com.pbl.pbl.repository.EventScheduleRepository;
import com.pbl.pbl.repository.ProvinceRepository;
import com.pbl.pbl.repository.SeatRepository;
import com.pbl.pbl.repository.TicketTypeRepository;
import com.pbl.pbl.repository.WardRepository;
import com.pbl.pbl.repository.UserRepository;

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
    private final EventScheduleRepository eventScheduleRepository;
    private final com.pbl.pbl.repository.TicketRepository ticketRepository;
    private final ArtistService artistService;
    private final com.pbl.pbl.repository.UserRepository userRepository;
    private final com.pbl.pbl.repository.OrderRepository orderRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<EventResponseDTO> getUpcomingEvents() {
        return eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.upcoming)
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    @Transactional(readOnly = true)
    public List<com.pbl.pbl.dto.EventResponseDTO> getAllEventsForAdmin() {
        return eventRepository.findAllByOrderByStartTimeDesc()
                .stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminEventListResponseDTO getAllEventsForAdminPaginated(Pageable pageable, List<EventStatus> statuses, String keyword) {
        Page<Event> eventsPage;
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();
        boolean hasStatuses = statuses != null && !statuses.isEmpty();

        if (hasKeyword) {
            String key = keyword.trim();
            if (hasStatuses) {
                eventsPage = eventRepository.findByStatusInAndKeyword(statuses, key, pageable);
            } else {
                eventsPage = eventRepository.findAllByKeyword(key, pageable);
            }
        } else {
            if (hasStatuses) {
                eventsPage = eventRepository.findByStatusIn(statuses, pageable);
            } else {
                eventsPage = eventRepository.findAll(pageable);
            }
        }

        List<Long> eventIds = eventsPage.getContent().stream().map(Event::getId).collect(Collectors.toList());
        Map<Long, Long> bookedSeatsMap = new HashMap<>();
        if (!eventIds.isEmpty()) {
            List<Object[]> counts = seatRepository.countSeatsGroupedByEventIds(eventIds, SeatStatus.BOOKED);
            for (Object[] row : counts) {
                bookedSeatsMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        Page<EventAdminSummaryDTO> summaryPage = eventsPage
                .map(event -> convertToSummaryDTOWithSold(event, bookedSeatsMap.getOrDefault(event.getId(), 0L)));

        long pendingCount = eventRepository.countByStatus(EventStatus.pending);
        long processedCount = eventRepository.countByStatusIn(
                List.of(EventStatus.upcoming, EventStatus.rejected, EventStatus.sold_out, EventStatus.ended));

        return AdminEventListResponseDTO.builder()
                .events(summaryPage)
                .pendingCount(pendingCount)
                .processedCount(processedCount)
                .build();
    }

    @Transactional(readOnly = true)
    public com.pbl.pbl.dto.OrganizerDashboardResponseDTO getOrganizerDashboardData(UUID organizerId,
            com.pbl.pbl.entity.EventStatus status, String keyword, Pageable pageable) {
        long totalEvents = eventRepository.countByOrganizer_Id(organizerId);
        long ticketsSold = seatRepository.countByOrganizerIdAndStatus(organizerId);
        BigDecimal revenue = seatRepository.sumRevenueByOrganizerIdAndStatus(organizerId);
        if (revenue == null)
            revenue = BigDecimal.ZERO;

        Page<Event> eventsPage;
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();

        if (status != null) {
            java.util.List<EventStatus> statuses = new java.util.ArrayList<>();
            statuses.add(status);
            if (status == EventStatus.upcoming) {
                statuses.add(EventStatus.sold_out); // Logically upcoming also includes sold out for managing
            }

            if (hasKeyword) {
                eventsPage = eventRepository.findByOrganizer_IdAndStatusInAndTitleContainingIgnoreCase(organizerId, statuses,
                        keyword.trim(), pageable);
            } else {
                eventsPage = eventRepository.findByOrganizer_IdAndStatusIn(organizerId, statuses, pageable);
            }
        } else {
            if (hasKeyword) {
                eventsPage = eventRepository.findByOrganizer_IdAndTitleContainingIgnoreCase(organizerId, keyword.trim(),
                        pageable);
            } else {
                eventsPage = eventRepository.findByOrganizer_Id(organizerId, pageable);
            }
        }

        List<Long> eventIds = eventsPage.getContent().stream().map(Event::getId).collect(Collectors.toList());
        Map<Long, Long> bookedSeatsMap = new HashMap<>();
        if (!eventIds.isEmpty()) {
            List<Object[]> counts = seatRepository.countSeatsGroupedByEventIds(eventIds, SeatStatus.BOOKED);
            for (Object[] row : counts) {
                bookedSeatsMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        Page<com.pbl.pbl.dto.EventAdminSummaryDTO> summaryPage = eventsPage
                .map(event -> convertToSummaryDTOWithSold(event, bookedSeatsMap.getOrDefault(event.getId(), 0L)));

        long rejectedCount = eventRepository.countByOrganizer_IdAndStatus(organizerId,
                com.pbl.pbl.entity.EventStatus.rejected);

        return com.pbl.pbl.dto.OrganizerDashboardResponseDTO.builder()
                .totalEvents(totalEvents)
                .totalTicketsSold(ticketsSold)
                .totalRevenue(revenue)
                .rejectedCount(rejectedCount)
                .events(summaryPage)
                .build();
    }

    @Transactional(readOnly = true)
    public com.pbl.pbl.dto.EventResponseDTO getEventResponseById(Long id) {
        return convertToResponseDTO(getEventById(id));
    }

    @Transactional
    public EventResponseDTO updateEventStatus(Long id, EventStatus status, String rejectReason) {
        Event event = getEventById(id);

        if (status == EventStatus.rejected) {
            if (rejectReason == null || rejectReason.trim().isEmpty()) {
                throw new IllegalArgumentException("Lý do từ chối không được để trống");
            }
            event.setRejectReason(rejectReason);
        } else {
            event.setRejectReason(null); // Clear reason if it's no longer rejected
        }

        event.setStatus(status);
        Event saved = eventRepository.save(event);

        if (status == EventStatus.upcoming) {
            emailService.sendEventApprovedEmail(saved);
        }

        return convertToResponseDTO(saved);
    }

    @Transactional
    public EventResponseDTO resubmitEvent(Long id, UUID organizerId) {
        Event event = getEventById(id);
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new RuntimeException("Unauthorized: Only the organizer can resubmit this event");
        }
        if (event.getStatus() != EventStatus.rejected) {
            throw new RuntimeException("Chỉ có thể gửi lại yêu cầu phê duyệt cho sự kiện đang bị từ chối");
        }
        event.setStatus(EventStatus.pending);
        event.setRejectReason(null);
        Event saved = eventRepository.save(event);

        List<com.pbl.pbl.entity.User> admins = userRepository.findByRole_Name("ROLE_ADMIN");
        emailService.sendEventPendingReview(saved, admins);

        return convertToResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<com.pbl.pbl.dto.TicketTypeResponseDTO> getTicketTypesByEventId(Long eventId) {
        return ticketTypeRepository.findByEventSession_Event_Id(eventId)
                .stream()
                .map(tt -> com.pbl.pbl.dto.TicketTypeResponseDTO.builder()
                        .id(tt.getId())
                        .sessionId(tt.getEventSession().getId())
                        .name(tt.getName())
                        .price(tt.getPrice())
                        .totalQuantity(tt.getTotalQuantity())
                        .color(tt.getColor())
                        .build())
                .collect(Collectors.toList());
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
                        .x(s.getX())
                        .y(s.getY())
                        .color(s.getTicketType() != null ? s.getTicketType().getColor() : "")
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.pbl.pbl.dto.SeatResponseDTO> getSeatsBySessionId(Long sessionId) {
        return seatRepository.findByEventSessionId(sessionId)
                .stream()
                .map(s -> com.pbl.pbl.dto.SeatResponseDTO.builder()
                        .id(s.getId())
                        .seatNumber(s.getSeatNumber())
                        .status(s.getStatus().name())
                        .ticketTypeName(s.getTicketType() != null ? s.getTicketType().getName() : "")
                        .price(s.getTicketType() != null ? s.getTicketType().getPrice() : BigDecimal.ZERO)
                        .x(s.getX())
                        .y(s.getY())
                        .color(s.getTicketType() != null ? s.getTicketType().getColor() : "")
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UpcomingEventCardDTO> getUpcomingEventsForHomepage() {
        return searchEvents("", null, "Tất cả khu vực", null, null, "Tất cả thời gian", "Mới nhất").stream().limit(4)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UpcomingEventCardDTO> searchEvents(String keyword, Long categoryId, String province,
            BigDecimal minPrice, BigDecimal maxPrice,
            String dateFilter, String sortBy) {
        List<Event> events = eventRepository.findByStatusOrderByStartTimeAsc(EventStatus.upcoming);

        Map<Long, BigDecimal[]> minMaxByEventId = new HashMap<>();
        Map<Long, Integer> ticketsLeftByEventId = new HashMap<>();
        Map<Long, Integer> totalTicketsByEventId = new HashMap<>();

        for (Object[] row : ticketTypeRepository.findMinMaxPriceGroupedByEventStatus(EventStatus.upcoming)) {
            Long eventId = ((Number) row[0]).longValue();
            minMaxByEventId.put(eventId, new BigDecimal[] { (BigDecimal) row[1], (BigDecimal) row[2] });
            int totalQty = ((Number) row[3]).intValue();

            long bookedCount = seatRepository.countByEventSession_Event_IdAndStatus(eventId, SeatStatus.BOOKED);
            totalTicketsByEventId.put(eventId, totalQty);
            ticketsLeftByEventId.put(eventId, (int) (totalQty - bookedCount));
        }

        java.time.ZoneId vnZone = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        java.time.LocalDate today = java.time.LocalDate.now(vnZone);

        return events.stream()
                .filter(e -> keyword == null || keyword.trim().isEmpty() ||
                        e.getTitle().toLowerCase().contains(keyword.toLowerCase().trim()))
                .filter(e -> categoryId == null || categoryId == -1L ||
                        (e.getCategory() != null && e.getCategory().getId().equals(categoryId)))
                .filter(e -> province == null || province.equals("Tất cả khu vực") || province.trim().isEmpty() ||
                        (e.getProvince() != null && e.getProvince().getName().equalsIgnoreCase(province)))
                .filter(e -> {
                    if (dateFilter == null || dateFilter.equals("Tất cả thời gian"))
                        return true;
                    java.time.LocalDate eventDate = e.getStartTime().atZone(vnZone).toLocalDate();
                    if (dateFilter.equals("Hôm nay")) {
                        return eventDate.isEqual(today);
                    } else if (dateFilter.equals("Ngày mai")) {
                        return eventDate.isEqual(today.plusDays(1));
                    } else if (dateFilter.equals("Tháng này")) {
                        return eventDate.getMonth() == today.getMonth() && eventDate.getYear() == today.getYear();
                    } else {
                        try {
                            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                                    .ofPattern("dd/MM/yyyy");
                            java.time.LocalDate specificDate = java.time.LocalDate.parse(dateFilter, formatter);
                            return eventDate.isEqual(specificDate);
                        } catch (Exception ex) {
                            return true;
                        }
                    }
                })
                .filter(e -> {
                    BigDecimal[] minMax = minMaxByEventId.get(e.getId());
                    if (minMax == null)
                        return true;
                    BigDecimal eventMin = minMax[0];
                    BigDecimal eventMax = minMax[1];
                    if (minPrice != null && eventMax.compareTo(minPrice) < 0)
                        return false;
                    if (maxPrice != null && eventMin.compareTo(maxPrice) > 0)
                        return false;
                    return true;
                })
                .map(e -> UpcomingEventCardDTO.builder()
                        .id(e.getId())
                        .title(e.getTitle())
                        .posterUrl(e.getPosterUrl())
                        .startTime(e.getStartTime())
                        .provinceName(e.getProvince() != null ? e.getProvince().getName() : "")
                        .location(e.getLocation())
                        .categoryName(e.getCategory() != null ? e.getCategory().getName() : "")
                        .categoryColor(e.getCategory() != null ? e.getCategory().getColor() : "bg-slate-400")
                        .minPrice(minMaxByEventId.containsKey(e.getId()) ? minMaxByEventId.get(e.getId())[0] : null)
                        .maxPrice(minMaxByEventId.containsKey(e.getId()) ? minMaxByEventId.get(e.getId())[1] : null)
                        .ticketsLeft(ticketsLeftByEventId.getOrDefault(e.getId(), 0))
                        .totalTickets(totalTicketsByEventId.getOrDefault(e.getId(), 0))
                        .latitude(e.getLatitude())
                        .longitude(e.getLongitude())
                        .build())
                .sorted((e1, e2) -> {
                    if (sortBy == null || sortBy.equals("Mới nhất")) {
                        return e2.getStartTime().compareTo(e1.getStartTime());
                    } else if (sortBy.equals("Giá tăng dần")) {
                        BigDecimal p1 = e1.getMinPrice() != null ? e1.getMinPrice() : BigDecimal.ZERO;
                        BigDecimal p2 = e2.getMinPrice() != null ? e2.getMinPrice() : BigDecimal.ZERO;
                        return p1.compareTo(p2);
                    } else if (sortBy.equals("Giá giảm dần")) {
                        BigDecimal p1 = e1.getMinPrice() != null ? e1.getMinPrice() : BigDecimal.ZERO;
                        BigDecimal p2 = e2.getMinPrice() != null ? e2.getMinPrice() : BigDecimal.ZERO;
                        return p2.compareTo(p1);
                    }
                    return e2.getStartTime().compareTo(e1.getStartTime());
                })
                .toList();
    }

    @Transactional
    public EventResponseDTO createEvent(EventRequestDTO request, com.pbl.pbl.entity.User organizer) {
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

        List<com.pbl.pbl.entity.Artist> artists = request.getArtists() != null
                ? request.getArtists().stream()
                        .map(artistService::getOrCreateArtist)
                        .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();

        Event event = Event.builder()
                .title(request.getTitle())
                .category(category)
                .province(province)
                .ward(ward)
                .artists(artists)
                .description(request.getDescription())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .startTime(eventStart)
                .endTime(eventEnd)
                .posterUrl(request.getPosterUrl())
                .seatMapLayout(request.getSeatMapLayout())
                .organizer(organizer)
                .status(EventStatus.pending)
                .hasSeatMap(request.getHasSeatMap() == null ? true : request.getHasSeatMap())
                .build();

        event = eventRepository.save(event);

        if (request.getSchedules() != null) {
            for (EventScheduleRequestDTO schedReq : request.getSchedules()) {
                EventSchedule schedule = EventSchedule.builder()
                        .event(event)
                        .startTime(schedReq.getStartTime())
                        .activity(schedReq.getActivity())
                        .build();
                eventScheduleRepository.save(schedule);
                event.getSchedules().add(schedule);
            }
        }

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
                        .color(ttReq.getColor())
                        .build();
                tt = ticketTypeRepository.save(tt);
                ticketTypeMap.put(tt.getName(), tt);
            }

            // Generate Seats
            boolean hasSeatMap = request.getHasSeatMap() == null ? true : request.getHasSeatMap();
            java.util.Map<String, Integer> generatedCountMap = new java.util.HashMap<>();

            // 1. Save physically mapped seats
            if (hasSeatMap && request.getSeatMapConfig() != null && request.getSeatMapConfig().getSeats() != null) {
                for (com.pbl.pbl.dto.SeatRequestDTO seatReq : request.getSeatMapConfig().getSeats()) {
                    TicketType tt = ticketTypeMap.get(seatReq.getTicketTypeName());
                    if (tt != null) {
                        Seat seat = Seat.builder()
                                .eventSession(session)
                                .ticketType(tt)
                                .seatNumber(seatReq.getSeatNumber())
                                .status(SeatStatus.AVAILABLE)
                                .x(seatReq.getX())
                                .y(seatReq.getY())
                                .build();
                        seatRepository.save(seat);
                        generatedCountMap.put(tt.getName(), generatedCountMap.getOrDefault(tt.getName(), 0) + 1);
                    }
                }
            }

            // 2. Generate virtual seats for any remaining quantity (Standing Zones / GA)
            for (TicketType tt : ticketTypeMap.values()) {
                int currentGenerated = generatedCountMap.getOrDefault(tt.getName(), 0);
                int totalNeeded = tt.getTotalQuantity() != null ? tt.getTotalQuantity() : 0;
                
                if (currentGenerated < totalNeeded) {
                    for (int i = currentGenerated + 1; i <= totalNeeded; i++) {
                        Seat seat = Seat.builder()
                                .eventSession(session)
                                .ticketType(tt)
                                .seatNumber(tt.getName() + " - GA" + i)
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
        Event saved = eventRepository.save(event);

        List<com.pbl.pbl.entity.User> admins = userRepository.findByRole_Name("ROLE_ADMIN");
        emailService.sendEventPendingReview(saved, admins);

        return convertToResponseDTO(saved);
    }

    private String getRowLetter(int index) {
        StringBuilder row = new StringBuilder();
        while (index >= 0) {
            row.insert(0, (char) ('A' + (index % 26)));
            index = (index / 26) - 1;
        }
        return row.toString();
    }

    private com.pbl.pbl.dto.EventResponseDTO convertToResponseDTO(Event event) {
        Integer total = event.getTotalTickets();
        if (total == null || total == 0) {
            total = ticketTypeRepository.findByEventSession_Event_Id(event.getId())
                    .stream()
                    .mapToInt(tt -> tt.getTotalQuantity() != null ? tt.getTotalQuantity() : 0)
                    .sum();
        }

        long bookedCount = seatRepository.countByEventSession_Event_IdAndStatus(event.getId(), SeatStatus.BOOKED);
        Integer left = (int) (total - bookedCount);

        return com.pbl.pbl.dto.EventResponseDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .location(event.getLocation())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .posterUrl(event.getPosterUrl())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .status(event.getStatus())
                .rejectReason(event.getRejectReason())
                .createdAt(event.getCreatedAt())
                .totalTickets(total)
                .ticketsLeft(left)
                .hasSeatMap(event.getHasSeatMap())
                .seatMapLayout(event.getSeatMapLayout())
                .artists(event.getArtists().stream()
                        .map(artistService::convertToDTO)
                        .collect(Collectors.toList()))

                .category(event.getCategory() != null ? com.pbl.pbl.dto.EventResponseDTO.CategoryDTO.builder()
                        .id(event.getCategory().getId())
                        .name(event.getCategory().getName())
                        .color(event.getCategory().getColor())
                        .build() : null)
                .province(event.getProvince() != null ? com.pbl.pbl.dto.EventResponseDTO.ProvinceDTO.builder()
                        .id(event.getProvince().getId())
                        .name(event.getProvince().getName())
                        .build() : null)
                .organizer(event.getOrganizer() != null ? com.pbl.pbl.dto.EventResponseDTO.OrganizerInfoDTO.builder()
                        .id(event.getOrganizer().getId())
                        .fullName(event.getOrganizer().getFullName())
                        .email(event.getOrganizer().getEmail())
                        .avatar(event.getOrganizer().getAvatar())
                        .build() : null)
                .schedules(event.getSchedules() != null ? event.getSchedules().stream()
                        .map(s -> com.pbl.pbl.dto.EventScheduleResponseDTO.builder()
                                .id(s.getId())
                                .startTime(s.getStartTime())
                                .activity(s.getActivity())
                                .build())
                        .collect(Collectors.toList()) : new java.util.ArrayList<>())
                .sessions(event.getSessions() != null ? event.getSessions().stream()
                        .map(s -> com.pbl.pbl.dto.EventResponseDTO.SessionDTO.builder()
                                .id(s.getId())
                                .sessionDate(s.getSessionDate())
                                .startTime(s.getStartTime())
                                .endTime(s.getEndTime())
                                .name(s.getName())
                                .build())
                        .collect(Collectors.toList()) : new java.util.ArrayList<>())
                .build();
    }

    private EventAdminSummaryDTO convertToSummaryDTO(Event event) {
        long sold = seatRepository.countByEventSession_Event_IdAndStatus(event.getId(), SeatStatus.BOOKED);
        return convertToSummaryDTOWithSold(event, sold);
    }

    private EventAdminSummaryDTO convertToSummaryDTOWithSold(Event event, long sold) {
        int total = event.getTotalTickets() != null ? event.getTotalTickets() : 0;

        return EventAdminSummaryDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .location(event.getLocation())
                .posterUrl(event.getPosterUrl())
                .startTime(event.getStartTime())
                .createdAt(event.getCreatedAt())
                .status(event.getStatus())
                .categoryName(event.getCategory() != null ? event.getCategory().getName() : "")
                .categoryColor(event.getCategory() != null ? event.getCategory().getColor() : "")
                .organizerName(event.getOrganizer() != null ? event.getOrganizer().getFullName() : "")
                .organizerEmail(event.getOrganizer() != null ? event.getOrganizer().getEmail() : "")
                .organizerAvatar(event.getOrganizer() != null ? event.getOrganizer().getAvatar() : null)
                .ticketsSold((int) sold)
                .totalTickets(total)
                .rejectReason(event.getRejectReason())
                .build();
    }

    @Transactional(readOnly = true)
    public List<com.pbl.pbl.dto.EventAttendeeDTO> getEventAttendees(Long eventId) {
        List<com.pbl.pbl.entity.Ticket> tickets = ticketRepository.findByEventIdWithDetails(eventId);
        return tickets.stream().map(this::convertToAttendeeDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.pbl.pbl.dto.EventManagementStatsDTO getEventManagementStats(Long eventId) {
        List<com.pbl.pbl.entity.Ticket> tickets = ticketRepository.findByEventIdWithDetails(eventId);
        
        long totalSeats = seatRepository.countByEventSession_Event_Id(eventId);
        long soldSeats = tickets.stream().filter(t -> t.getStatus() != com.pbl.pbl.entity.TicketStatus.CANCELLED)
                .count();
        long checkedInSeats = tickets.stream().filter(t -> t.getStatus() == com.pbl.pbl.entity.TicketStatus.CHECKED_IN)
                .count();

        BigDecimal totalRevenue = tickets.stream()
                .filter(t -> t.getStatus() != com.pbl.pbl.entity.TicketStatus.CANCELLED)
                .map(t -> t.getSeat().getTicketType().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> salesByTicketType = tickets.stream()
                .filter(t -> t.getStatus() != com.pbl.pbl.entity.TicketStatus.CANCELLED)
                .collect(Collectors.groupingBy(t -> t.getSeat().getTicketType().getName(), Collectors.counting()));

        Map<String, BigDecimal> dailyRevenue = tickets.stream()
                .filter(t -> t.getStatus() != com.pbl.pbl.entity.TicketStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        t -> t.getPurchaseDate().toLocalDate().toString(),
                        Collectors.reducing(BigDecimal.ZERO, t -> t.getSeat().getTicketType().getPrice(),
                                BigDecimal::add)));

        return com.pbl.pbl.dto.EventManagementStatsDTO.builder()
                .totalSeats(totalSeats)
                .soldSeats(soldSeats)
                .checkedInSeats(checkedInSeats)
                .totalRevenue(totalRevenue)
                .salesByTicketType(salesByTicketType)
                .dailyRevenue(dailyRevenue)
                .build();
    }

    @Transactional
    public void updateTicketStatus(Long ticketId, com.pbl.pbl.entity.TicketStatus status) {
        com.pbl.pbl.entity.Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        // Prevent undoing check-in
        if (ticket.getStatus() == com.pbl.pbl.entity.TicketStatus.CHECKED_IN) {
            throw new RuntimeException("Vé này đã được check-in và không thể hoàn tác");
        }

        ticket.setStatus(status);
        if (status == com.pbl.pbl.entity.TicketStatus.CHECKED_IN && ticket.getOrder() != null) {
            if (ticket.getOrder().getCheckInDate() == null) {
                ticket.getOrder().setCheckInDate(LocalDateTime.now());
                orderRepository.save(ticket.getOrder());
            }
        }
        ticketRepository.save(ticket);
    }

    @Transactional
    public void checkInByOrderQR(String qrCode) {
        com.pbl.pbl.entity.Order order = orderRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã QR này"));
        
        if (order.getTickets().isEmpty()) {
            throw new RuntimeException("Đơn hàng không có vé nào");
        }

        boolean allAlreadyCheckedIn = true;
        LocalDateTime now = LocalDateTime.now();
        for (com.pbl.pbl.entity.Ticket ticket : order.getTickets()) {
            if (ticket.getStatus() != com.pbl.pbl.entity.TicketStatus.CHECKED_IN) {
                ticket.setStatus(com.pbl.pbl.entity.TicketStatus.CHECKED_IN);
                ticketRepository.save(ticket);
                allAlreadyCheckedIn = false;
            }
        }

        if (allAlreadyCheckedIn) {
            throw new com.pbl.pbl.exception.BadRequestException("Tất cả vé trong đơn hàng này đã được check-in từ trước");
        }

        order.setCheckInDate(now);
        orderRepository.save(order);
    }

    @Transactional
    public void checkInOrderByOrderId(Long orderId) {
        com.pbl.pbl.entity.Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        if (order.getTickets().isEmpty()) {
            throw new RuntimeException("Đơn hàng không có vé nào");
        }

        boolean allAlreadyCheckedIn = true;
        LocalDateTime now = LocalDateTime.now();
        for (com.pbl.pbl.entity.Ticket ticket : order.getTickets()) {
            if (ticket.getStatus() != com.pbl.pbl.entity.TicketStatus.CHECKED_IN) {
                ticket.setStatus(com.pbl.pbl.entity.TicketStatus.CHECKED_IN);
                ticketRepository.save(ticket);
                allAlreadyCheckedIn = false;
            }
        }

        if (allAlreadyCheckedIn) {
            throw new com.pbl.pbl.exception.BadRequestException("Tất cả vé trong đơn hàng này đã được check-in từ trước");
        }

        order.setCheckInDate(now);
        orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public com.pbl.pbl.dto.OrderDTO getOrderByQR(String qrCode) {
        com.pbl.pbl.entity.Order order = orderRepository.findWithDetailsByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã QR này"));
        return convertToOrderDTO(order);
    }

    public com.pbl.pbl.dto.OrderDTO convertToOrderDTO(com.pbl.pbl.entity.Order order) {
        var firstTicket = order.getTickets().isEmpty() ? null : order.getTickets().get(0);
        var mainSeat = (firstTicket != null) ? firstTicket.getSeat() : null;
        var mainSession = (mainSeat != null) ? mainSeat.getEventSession() : null;
        var mainEvent = (mainSession != null) ? mainSession.getEvent() : null;

        return com.pbl.pbl.dto.OrderDTO.builder()
            .id(order.getId())
            .userEmail(order.getUser() != null ? order.getUser().getEmail() : "Unknown")
            .userName(order.getUser() != null ? order.getUser().getFullName() : "Unknown")
            .userAvatar(order.getUser() != null ? order.getUser().getAvatar() : null)
            .totalAmount(order.getTotalAmount())
            .platformFee(order.getPlatformFee())
            .status(order.getStatus() != null ? order.getStatus().name() : "PENDING")
            .paymentMethod(order.getPaymentMethod())
            .purchaseDate(order.getPurchaseDate())
            .eventId(mainEvent != null ? mainEvent.getId() : null)
            .eventTitle(mainEvent != null ? mainEvent.getTitle() : "Unknown Event")
            .eventPosterUrl(mainEvent != null ? mainEvent.getPosterUrl() : null)
            .eventSessionId(mainSession != null ? mainSession.getId() : null)
            .qrCode(order.getQrCode())
            .tickets(order.getTickets().stream()
                    .map(ticket -> {
                        var seat = ticket.getSeat();
                        var session = (seat != null) ? seat.getEventSession() : null;
                        var event = (session != null) ? session.getEvent() : null;
                        var type = (seat != null) ? seat.getTicketType() : null;

                        return com.pbl.pbl.dto.OrderDTO.TicketDetailDTO.builder()
                                .id(ticket.getId())
                                .eventTitle(event != null ? event.getTitle() : "Unknown Event")
                                .seatNumber(seat != null ? seat.getSeatNumber() : "N/A")
                                .price(type != null ? type.getPrice() : java.math.BigDecimal.ZERO)
                                .sessionName(session != null ? session.getName() : "N/A")
                                .seatId(seat != null ? seat.getId() : null)
                                .ticketTypeName(type != null ? type.getName() : "N/A")
                                .ticketTypeColor(type != null ? type.getColor() : null)
                                .status(ticket.getStatus() != null ? ticket.getStatus().name() : "PAID")
                                .build();
                    })
                    .collect(Collectors.toList()))
                .checkInDate(order.getCheckInDate())
                .build();
    }

    private com.pbl.pbl.dto.EventAttendeeDTO convertToAttendeeDTO(com.pbl.pbl.entity.Ticket ticket) {
        return com.pbl.pbl.dto.EventAttendeeDTO.builder()
                .ticketId(ticket.getId())
                .orderId(ticket.getOrder() != null ? ticket.getOrder().getId() : null)
                .userName(ticket.getUser().getFullName())
                .userEmail(ticket.getUser().getEmail())
                .seatNumber(ticket.getSeat().getSeatNumber())
                .ticketTypeName(ticket.getSeat().getTicketType().getName())
                .ticketTypeColor(ticket.getSeat().getTicketType().getColor())
                .status(ticket.getStatus().name())
                .purchaseDate(ticket.getPurchaseDate())
                .checkInDate(ticket.getOrder() != null ? ticket.getOrder().getCheckInDate() : null)
                .userAvatar(ticket.getUser().getAvatar())
                .build();
    }
}
