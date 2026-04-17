package com.pbl.pbl.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pbl.pbl.entity.Artist;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    Optional<Artist> findByName(String name);
    
    java.util.List<Artist> findByNameContainingIgnoreCase(String name);
    
    java.util.List<Artist> findByNameContainingIgnoreCaseAndNameNotIn(String name, java.util.Collection<String> excludeNames);
}

