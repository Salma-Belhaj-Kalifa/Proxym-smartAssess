package com.example.smart_assess.controller;

import com.example.smart_assess.repository.InternshipPositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@Slf4j
public class DebugController {

    private final InternshipPositionRepository positionRepository;

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        log.info("=== DEBUG TEST ENDPOINT CALLED ===");
        Map<String, String> response = new HashMap<>();
        response.put("message", "Debug endpoint is working");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/activate-all-positions")
    public ResponseEntity<Map<String, Object>> activateAllPositions() {
        log.info("=== ACTIVATING ALL POSITIONS ===");
        Map<String, Object> response = new HashMap<>();
        
        try {
            var positions = positionRepository.findAll();
            int activatedCount = 0;
            
            for (var position : positions) {
                if (!position.getIsActive()) {
                    position.setIsActive(true);
                    positionRepository.save(position);
                    activatedCount++;
                    log.info("Activated position ID: {} - {}", position.getId(), position.getTitle());
                }
            }
            
            response.put("success", true);
            response.put("message", "Positions activated successfully");
            response.put("activatedCount", activatedCount);
            response.put("totalPositions", positions.size());
            
            log.info("Successfully activated {} out of {} positions", activatedCount, positions.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            log.error("Error activating positions", e);
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/minimal-test/{candidateId}")
    public ResponseEntity<Map<String, Object>> minimalTest(
            @PathVariable Long candidateId) {
        
        log.info("=== MINIMAL TEST START ===");
        log.info("candidateId: {}", candidateId);
        
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("candidateId", candidateId);
            response.put("message", "Minimal test completed");
            
            log.info("=== MINIMAL TEST SUCCESS ===");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("=== MINIMAL TEST ERROR ===", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("errorType", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    @PostMapping("/test-upload/{candidateId}")
    public ResponseEntity<Map<String, Object>> testUpload(
            @PathVariable Long candidateId,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        
        log.info("=== DEBUG UPLOAD START ===");
        log.info("candidateId: {}", candidateId);
        
        if (file != null) {
            log.info("fileName: {}", file.getOriginalFilename());
            log.info("fileSize: {}", file.getSize());
            log.info("contentType: {}", file.getContentType());
            log.info("isEmpty: {}", file.isEmpty());
        } else {
            log.info("file is null");
        }
        
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("candidateId", candidateId);
            
            if (file != null) {
                response.put("fileName", file.getOriginalFilename());
                response.put("fileSize", file.getSize());
                byte[] bytes = file.getBytes();
                response.put("bytesLength", bytes.length);
            }
            
            response.put("message", "Debug upload completed");
            
            log.info("=== DEBUG UPLOAD SUCCESS ===");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("=== DEBUG UPLOAD ERROR ===", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("errorType", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
