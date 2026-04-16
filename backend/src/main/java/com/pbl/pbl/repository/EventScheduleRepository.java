package com.pbl.pbl.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.EventSchedule;

@Repository
public interface EventScheduleRepository extends JpaRepository<EventSchedule, Long> {
}
