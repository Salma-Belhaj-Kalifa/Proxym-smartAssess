package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CandidateCVDto;
import com.example.smart_assess.dto.TechnicalProfileDto;
import com.example.smart_assess.service.CandidateCVService;
import com.example.smart_assess.service.TechnicalProfileService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/ai-analysis")
@Slf4j
public class AIAnalysisController {

    @Autowired
    private CandidateCVService cvService;

    @Autowired
    private TechnicalProfileService technicalProfileService;

    @Autowired
    private WebClient webClient;

    @PostMapping(value = "/analyze-cv/{candidateId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> analyzeCV(
            @PathVariable Long candidateId,
            @RequestParam(name = "file", required = false) MultipartFile file) {

        if (file == null || file.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "File is null or empty");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        try {
            // STEP 1: Upload CV
            CandidateCVDto cvDto = cvService.uploadCV(candidateId, file);
            log.info("CV uploaded successfully with ID: {}", cvDto.getId());

            // STEP 2: Download CV bytes
            byte[] cvData = cvService.downloadCV(cvDto.getId());

            // STEP 3: Async FastAPI call
            CompletableFuture<Map<String, Object>> fastApiFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    MultipartBodyBuilder builder = new MultipartBodyBuilder();

                    builder.part("file", new ByteArrayResource(cvData) {
                        @Override
                        public String getFilename() {
                            return cvDto.getFileName();
                        }
                    });

                    Map<String, Object> response = webClient.post()
                            .uri("http://localhost:8000/api/v1/analyze-cv")
                            .contentType(MediaType.MULTIPART_FORM_DATA)
                            .bodyValue(builder.build())
                            .retrieve()
                            .bodyToMono(Map.class)
                            .timeout(Duration.ofSeconds(30))
                            .block();

                    log.info("FastAPI analysis completed");
                    return response;

                } catch (Exception e) {
                    log.error("FastAPI analysis failed", e);
                    throw new RuntimeException("FastAPI analysis failed");
                }
            });

            // STEP 4: Wait FastAPI result
            Map<String, Object> analysisResult = fastApiFuture.get(60, TimeUnit.SECONDS);

            if (analysisResult == null || analysisResult.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "FastAPI returned empty response");
                return ResponseEntity.status(500).body(errorResponse);
            }

            log.info("FastAPI response keys: {}", analysisResult.keySet());

            // STEP 5: Convert to JsonNode
            ObjectMapper mapper = new ObjectMapper();
            JsonNode analysisJson = mapper.valueToTree(analysisResult);

            // STEP 6: Build technical profile
            TechnicalProfileDto technicalProfile = TechnicalProfileDto.builder()
                    .candidateId(candidateId)
                    .cvId(cvDto.getId())
                    .parsedData(analysisJson)
                    .createdAt(LocalDateTime.now())
                    .build();

            // STEP 7: Save profile
            TechnicalProfileDto savedProfile = technicalProfileService.createTechnicalProfile(technicalProfile);

            // STEP 8: Response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cv", cvDto);
            response.put("analysis", analysisResult);
            response.put("technicalProfile", savedProfile);
            response.put("message", "CV analyzed successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Global error", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}