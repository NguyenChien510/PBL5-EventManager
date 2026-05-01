package com.pbl.pbl.mapper;

import org.springframework.stereotype.Component;

import com.pbl.pbl.dto.RoleDTO;
import com.pbl.pbl.dto.UserDTO;
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

        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(roleDto)
                .loyaltyPoints(user.getLoyaltyPoints())
                .avatar(user.getAvatar())
                .createdAt(user.getCreatedAt())
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
