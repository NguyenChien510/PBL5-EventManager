package com.pbl.pbl.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.Seat;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
}
