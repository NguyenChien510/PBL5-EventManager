package com.pbl.pbl.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    private String content;
    private Integer rating;
    private LocalDateTime createdAt;
    private Long eventId;
    private String eventName;
    private String eventThumbnail;
    private java.util.List<String> images;
    private UserDTO user;
}
