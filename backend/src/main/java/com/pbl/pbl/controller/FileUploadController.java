package com.pbl.pbl.controller;

import com.pbl.pbl.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@CrossOrigin
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String url = cloudinaryService.uploadFile(file);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/events")
    public ResponseEntity<?> uploadEventPoster(@RequestParam("file") MultipartFile file) {
        try {
            String url = cloudinaryService.uploadFile(file, "events");
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/multiple")
    public ResponseEntity<?> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            java.util.List<String> urls = new java.util.ArrayList<>();
            for (MultipartFile file : files) {
                urls.add(cloudinaryService.uploadFile(file, "reviews"));
            }
            return ResponseEntity.ok(urls);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }
}
