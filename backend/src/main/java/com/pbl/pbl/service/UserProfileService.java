package com.pbl.pbl.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl.pbl.dto.LinkCardRequestDTO;
import com.pbl.pbl.dto.ProfileStatsDTO;
import com.pbl.pbl.dto.ProfileTicketPreviewDTO;
import com.pbl.pbl.dto.ProfileWalletDTO;
import com.pbl.pbl.dto.UpdateProfileRequestDTO;
import com.pbl.pbl.dto.UserDTO;
import com.pbl.pbl.dto.UserProfileOverviewDTO;
import com.pbl.pbl.dto.WalletTopUpRequestDTO;
import com.pbl.pbl.entity.Ticket;
import com.pbl.pbl.entity.TicketStatus;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.mapper.UserMapper;
import com.pbl.pbl.repository.TicketRepository;
import com.pbl.pbl.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private static final int RECENT_TICKETS_LIMIT = 5;

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final UserMapper userMapper;
    private final UserService userService;

    @Transactional(readOnly = true)
    public UserProfileOverviewDTO getOverview() {
        User user = userService.getCurrentUserEntity();

        long eventsCount = ticketRepository.countDistinctEventsAttended(user.getId(), TicketStatus.PAID);
        long ticketsCount = ticketRepository.countByUserIdAndStatus(user.getId(), TicketStatus.PAID);

        List<Ticket> recent = ticketRepository.findRecentByUser(user.getId(), TicketStatus.PAID,
                PageRequest.of(0, RECENT_TICKETS_LIMIT));

        List<ProfileTicketPreviewDTO> previews = recent.stream()
                .map(this::toTicketPreview)
                .toList();

        var profile = userMapper.toDto(user);

        ProfileStatsDTO stats = ProfileStatsDTO.builder()
                .eventsAttendedCount(eventsCount)
                .activeTicketsCount(ticketsCount)
                .build();

        ProfileWalletDTO wallet = ProfileWalletDTO.builder()
                .balance(user.getWalletBalance())
                .cardLastFour(user.getCardLastFour())
                .build();

        return UserProfileOverviewDTO.builder()
                .profile(profile)
                .stats(stats)
                .wallet(wallet)
                .recentTickets(previews)
                .build();
    }

    @Transactional
    public UserDTO updateProfile(UpdateProfileRequestDTO request) {
        User user = userService.getCurrentUserEntity();

        boolean touched = false;
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
            touched = true;
        }
        if (request.getAvatarUrl() != null) {
            String url = request.getAvatarUrl().trim();
            user.setAvatarUrl(url.isEmpty() ? null : url);
            touched = true;
        }

        if (touched) {
            userRepository.save(user);
        }

        return userMapper.toDto(user);
    }

    @Transactional
    public ProfileWalletDTO topUpWallet(WalletTopUpRequestDTO request) {
        User user = userService.getCurrentUserEntity();
        BigDecimal amount = request.getAmount();
        user.setWalletBalance(user.getWalletBalance().add(amount));
        userRepository.save(user);
        return ProfileWalletDTO.builder()
                .balance(user.getWalletBalance())
                .cardLastFour(user.getCardLastFour())
                .build();
    }

    @Transactional
    public ProfileWalletDTO linkCard(LinkCardRequestDTO request) {
        User user = userService.getCurrentUserEntity();
        user.setCardLastFour(request.getCardLastFour());
        userRepository.save(user);
        return ProfileWalletDTO.builder()
                .balance(user.getWalletBalance())
                .cardLastFour(user.getCardLastFour())
                .build();
    }

    private ProfileTicketPreviewDTO toTicketPreview(Ticket t) {
        String title = "";
        if (t.getSeat() != null && t.getSeat().getEventSession() != null
                && t.getSeat().getEventSession().getEvent() != null) {
            title = t.getSeat().getEventSession().getEvent().getTitle();
        }
        String tier = "";
        if (t.getSeat() != null && t.getSeat().getTicketType() != null) {
            tier = t.getSeat().getTicketType().getName();
        }
        return ProfileTicketPreviewDTO.builder()
                .id(t.getId())
                .code("E-TICKET-" + t.getId())
                .eventTitle(title)
                .ticketTierLabel(tier)
                .purchaseDate(t.getPurchaseDate())
                .build();
    }
}
