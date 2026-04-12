package com.pbl.pbl.mapper;

import java.time.ZoneId;

import org.springframework.stereotype.Component;

import com.pbl.pbl.dto.RoleDTO;
import com.pbl.pbl.dto.UserDTO;
import java.math.BigDecimal;

import com.pbl.pbl.entity.MembershipTier;
import com.pbl.pbl.entity.Role;
import com.pbl.pbl.entity.User;

@Component
public class UserMapper {

    public UserDTO toDto(User user) {
        if (user == null) {
            return null;
        }

        RoleDTO roleDto = null;
        if (user.getRole() != null) {
            roleDto = RoleDTO.builder()
                    .name(user.getRole().getName())
                    .build();
        }

        Integer joinYear = null;
        if (user.getCreatedAt() != null) {
            joinYear = user.getCreatedAt().atZone(ZoneId.of("Asia/Ho_Chi_Minh")).getYear();
        }

        String tierName = user.getMembershipTier() != null ? user.getMembershipTier().name() : null;

        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .loyaltyPoints(user.getLoyaltyPoints())
                .membershipTier(tierName)
                .joinYear(joinYear)
                .createdAt(user.getCreatedAt())
                .role(roleDto)
                .build();
    }

    public User toEntity(UserDTO userDto) {
        if (userDto == null) {
            return null;
        }

        Role role = null;
        if (userDto.getRole() != null) {
            role = Role.builder()
                    .name(userDto.getRole().getName())
                    .build();
        }

        return User.builder()
                .id(userDto.getId())
                .email(userDto.getEmail())
                .fullName(userDto.getFullName())
                .avatarUrl(userDto.getAvatarUrl())
                .loyaltyPoints(userDto.getLoyaltyPoints() != null ? userDto.getLoyaltyPoints() : 0)
                .membershipTier(MembershipTier.STANDARD)
                .walletBalance(BigDecimal.ZERO)
                .role(role)
                .build();
    }

    public RoleDTO toRoleDto(Role role) {
        if (role == null) {
            return null;
        }

        return RoleDTO.builder()
                .name(role.getName())
                .build();
    }
}
