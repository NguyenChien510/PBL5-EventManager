package com.pbl.pbl.mapper;

import org.mapstruct.Mapper;

import com.pbl.pbl.dto.RoleDTO;
import com.pbl.pbl.entity.Role;

@Mapper(config = MapStructConfig.class)
public interface RoleMapper {
    RoleDTO toDto(Role role);

    Role toEntity(RoleDTO roleDto);
}
