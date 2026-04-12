package com.pbl.pbl.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileOverviewDTO {
    private UserDTO profile;
    private ProfileStatsDTO stats;
    private ProfileWalletDTO wallet;
    private List<ProfileTicketPreviewDTO> recentTickets;
}
