package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CandidateCVDto;
import com.example.smart_assess.service.CandidateCVService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/simple-upload")
@RequiredArgsConstructor
@Slf4j
public class SimpleUploadController {

    private final CandidateCVService cvService;

    @PostMapping("/cv/{candidateId}")
    public ResponseEntity<Map<String, Object>> uploadCV(
            @PathVariable Long candidateId,
            @RequestParam("file") MultipartFile file) {
        
        log.info("Simple CV upload - candidateId: {}, fileName: {}, fileSize: {}", 
                candidateId, file.getOriginalFilename(), file.getSize());
        
        try {
            // Validation du fichier
            if (file.isEmpty()) {
                log.error("File is empty for candidateId: {}", candidateId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "File is empty");
                return ResponseEntity.status(400).body(errorResponse);
            }

            // Upload CV → Store in DB (seulement cette étape)
            log.info("Uploading CV to database...");
            CandidateCVDto cvDto = cvService.uploadCV(candidateId, file);
            log.info("CV uploaded successfully with ID: {}", cvDto.getId());

            // Retourner une réponse simple
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cv", cvDto);
            response.put("message", "CV uploaded successfully");

            log.info("Simple upload completed for candidateId: {}", candidateId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error during simple CV upload for candidateId: {}", candidateId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to upload CV: " + e.getMessage());
            errorResponse.put("success", false);
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
