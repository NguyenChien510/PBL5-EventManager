package com.pbl.pbl.mapper;

import org.mapstruct.Mapper;

import com.pbl.pbl.dto.CategoryDTO;
import com.pbl.pbl.entity.Category;

@Mapper(componentModel = "spring", config = MapStructConfig.class)
public interface CategoryMapper {
    CategoryDTO toDto(Category category);
    Category toEntity(CategoryDTO categoryDto);
}
