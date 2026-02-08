package com.pbl.pbl.mapper;

import org.mapstruct.Mapper;

import com.pbl.pbl.dto.RoleDTO;
import com.pbl.pbl.dto.UserDTO;
import com.pbl.pbl.entity.Role;
import com.pbl.pbl.entity.User;

@Mapper(config = MapStructConfig.class)
public interface UserMapper {
    UserDTO toDto(User user);
    User toEntity(UserDTO userDto);
    RoleDTO toRoleDto(Role role);
}
