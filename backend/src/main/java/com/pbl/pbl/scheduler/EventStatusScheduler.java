package com.pbl.pbl.scheduler;

import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.pbl.pbl.entity.EventStatus;
import com.pbl.pbl.repository.EventRepository;

@Component
public class EventStatusScheduler {

    private static final Logger logger = LoggerFactory.getLogger(EventStatusScheduler.class);

    @Autowired
    private EventRepository eventRepository;

    // Runs every 60 seconds (1 minute)
    @Scheduled(fixedRate = 60000)
    public void checkAndTransitionEndedEvents() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<EventStatus> targetStatuses = List.of(EventStatus.upcoming, EventStatus.sold_out);
            int updatedCount = eventRepository.updateStatusForEndedEvents(now, targetStatuses);
            if (updatedCount > 0) {
                logger.info("Automatically transitioned {} events to 'ended' status (time surpassed: {})", updatedCount, now);
            }
        } catch (Exception e) {
            logger.error("Error running ended event status transition scheduler: ", e);
        }
    }
}
