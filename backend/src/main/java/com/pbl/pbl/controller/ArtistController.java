package com.pbl.pbl.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pbl.pbl.dto.ArtistDTO;
import com.pbl.pbl.service.ArtistService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/artists")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ArtistController {

    private final ArtistService artistService;

    @GetMapping
    public ResponseEntity<List<ArtistDTO>> getAllArtists() {
        return ResponseEntity.ok(artistService.getAllArtists());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ArtistDTO>> searchArtists(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String query,
            @org.springframework.web.bind.annotation.RequestParam(required = false) List<String> exclude) {
        return ResponseEntity.ok(artistService.searchArtists(query, exclude));
    }
}

