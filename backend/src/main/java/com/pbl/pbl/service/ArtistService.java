package com.pbl.pbl.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbl.pbl.dto.ArtistDTO;
import com.pbl.pbl.entity.Artist;
import com.pbl.pbl.repository.ArtistRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ArtistService {

    private final ArtistRepository artistRepository;

    @Transactional(readOnly = true)
    public List<ArtistDTO> getAllArtists() {
        return artistRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ArtistDTO> searchArtists(String query, List<String> excludeNames) {
        String safeQuery = (query == null) ? "" : query;
        List<Artist> results;
        
        if (excludeNames == null || excludeNames.isEmpty()) {
            results = artistRepository.findByNameContainingIgnoreCase(safeQuery);
        } else {
            results = artistRepository.findByNameContainingIgnoreCaseAndNameNotIn(safeQuery, excludeNames);
        }
        
        return results.stream()
                .map(this::convertToDTO)
                .toList();
    }


    @Transactional
    public Artist getOrCreateArtist(String name) {
        return artistRepository.findByName(name)
                .orElseGet(() -> {
                    Artist newArtist = Artist.builder()
                            .name(name)
                            .avatar("https://ui-avatars.com/api/?name=" + name.replace(" ", "+") + "&background=random&color=fff")
                            .build();
                    return artistRepository.save(newArtist);
                });
    }

    public ArtistDTO convertToDTO(Artist artist) {
        return ArtistDTO.builder()
                .id(artist.getId())
                .name(artist.getName())
                .avatar(artist.getAvatar())
                .build();
    }
}
