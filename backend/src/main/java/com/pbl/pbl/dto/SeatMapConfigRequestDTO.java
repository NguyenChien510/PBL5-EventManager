package com.pbl.pbl.dto;

import java.util.List;
import lombok.Data;

@Data
public class SeatMapConfigRequestDTO {
    private Integer rows;
    private Integer seatsPerRow;
    private List<RowAssignmentRequestDTO> rowAssignments;
}
