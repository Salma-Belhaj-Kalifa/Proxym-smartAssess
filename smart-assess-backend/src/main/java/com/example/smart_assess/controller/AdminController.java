package com.example.smart_assess.controller;

import com.example.smart_assess.service.CandidateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final CandidateService candidateService;

    @PostMapping("/refresh-cache")
    public ResponseEntity<Map<String, Object>> refreshCache() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("Refreshing cache and reloading candidates from database");
            
            // Force reload of candidates from database
            var candidates = candidateService.getAllCandidates();
            
            result.put("success", true);
            result.put("message", "Cache refreshed successfully");
            result.put("candidatesCount", candidates.size());
            result.put("candidates", candidates);
            
            log.info("Cache refreshed. Found {} candidates", candidates.size());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error refreshing cache", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
}
