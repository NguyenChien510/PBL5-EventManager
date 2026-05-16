package com.pbl.pbl.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Async
    public void syncDatabase() {
        try {
            String url = aiServiceUrl + "/sync-db";
            log.info("Sending sync request to AI Service: {}", url);
            restTemplate.postForEntity(url, null, String.class);
            log.info("AI Database sync completed successfully.");
        } catch (Exception e) {
            log.error("Failed to sync AI database: {}", e.getMessage());
        }
    }
}
