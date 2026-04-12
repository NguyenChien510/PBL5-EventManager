package com.pbl.pbl.mapper;

import org.springframework.stereotype.Component;

import com.pbl.pbl.dto.CategoryDTO;
import com.pbl.pbl.entity.Category;

@Component
public class CategoryMapper {

    public CategoryDTO toDto(Category category) {
        if (category == null) {
            return null;
        }
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .build();
    }

    public Category toEntity(CategoryDTO categoryDto) {
        if (categoryDto == null) {
            return null;
        }
        return Category.builder()
                .id(categoryDto.getId())
                .name(categoryDto.getName())
                .icon(categoryDto.getIcon())
                .color(categoryDto.getColor())
                .build();
    }
}
