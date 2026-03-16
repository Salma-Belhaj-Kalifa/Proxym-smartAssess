package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CandidateCVDto;
import com.example.smart_assess.service.CandidateCVService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@Slf4j
public class CandidateCVController {

    private final CandidateCVService cvService;

    @GetMapping("/candidate/{candidateId}/exists")
    public ResponseEntity<Map<String, Object>> checkCandidateExists(@PathVariable Long candidateId) {
        log.info("Checking if candidate exists with ID: {}", candidateId);
        
        try {
            boolean exists = cvService.candidateExists(candidateId);
            Map<String, Object> response = new HashMap<>();
            response.put("candidateId", candidateId);
            response.put("exists", exists);
            
            if (exists) {
                response.put("message", "Candidate found");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Candidate not found");
                return ResponseEntity.status(404).body(response);
            }
        } catch (Exception e) {
            log.error("Error checking candidate existence for ID: {}", candidateId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to check candidate: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/cv")
    public ResponseEntity<Map<String, Object>> uploadCV(@RequestParam("file") MultipartFile file, @RequestParam("candidateId") String candidateIdStr) {
        log.info("Upload CV request received - candidateIdStr: {}, fileName: {}, fileSize: {}", 
                   candidateIdStr, file.getOriginalFilename(), file.getSize());
        
        // Validation du fichier
        if (file.isEmpty()) {
            log.error("File is empty for candidateId: {}", candidateIdStr);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "File is empty");
            return ResponseEntity.status(400).body(errorResponse);
        }
        
        try {
            Long candidateId = Long.parseLong(candidateIdStr);
            log.info("Parsed candidateId: {}", candidateId);
            
            CandidateCVDto cvDto = cvService.uploadCV(candidateId, file);
            
            // Retourner le format attendu par le frontend
            Map<String, Object> response = new HashMap<>();
            response.put("cvUrl", "/api/candidates/download/" + cvDto.getId());
            response.put("id", cvDto.getId());
            response.put("fileName", cvDto.getFileName());
            response.put("fileSizeBytes", cvDto.getFileSizeBytes());
            response.put("parsingStatus", cvDto.getParsingStatus());
            response.put("uploadDate", cvDto.getUploadDate());
            
            log.info("CV uploaded successfully - cvId: {}, cvUrl: {}", cvDto.getId(), response.get("cvUrl"));
            return ResponseEntity.ok(response);
        } catch (NumberFormatException e) {
            log.error("Invalid candidateId format: {}", candidateIdStr);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid candidateId format: " + candidateIdStr);
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            log.error("Error uploading CV for candidateId: {}", candidateIdStr, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to upload CV: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/cv/debug")
    public ResponseEntity<Map<String, Object>> debugUpload(@RequestParam Map<String, Object> params, @RequestParam("file") MultipartFile file) {
        log.info("Debug upload - All params: {}", params);
        log.info("Debug upload - File: {}, size: {}", file.getOriginalFilename(), file.getSize());
        
        Map<String, Object> response = new HashMap<>();
        response.put("receivedParams", params);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", file.getSize());
        response.put("message", "Debug endpoint - params received successfully");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cv/{candidateId}")
    public ResponseEntity<Map<String, Object>> uploadCVWithPath(@PathVariable Long candidateId, @RequestParam("file") MultipartFile file) {
        CandidateCVDto cvDto = cvService.uploadCV(candidateId, file);
        
        // Retourner le format attendu par le frontend
        Map<String, Object> response = new HashMap<>();
        response.put("cvUrl", "/api/candidates/download/" + cvDto.getId());
        response.put("id", cvDto.getId());
        response.put("fileName", cvDto.getFileName());
        response.put("fileSizeBytes", cvDto.getFileSizeBytes());
        response.put("parsingStatus", cvDto.getParsingStatus());
        response.put("uploadDate", cvDto.getUploadDate());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<CandidateCVDto> getCVMetadata(@PathVariable Long candidateId) {
        return ResponseEntity.ok(cvService.getCVByCandidateId(candidateId));
    }

    @GetMapping("/download/{cvId}")
    public ResponseEntity<ByteArrayResource> downloadCV(@PathVariable Long cvId) {
        CandidateCVDto cvDto = cvService.getCVByCandidateId(cvId);
        byte[] data = cvService.downloadCV(cvDto.getId());

        ByteArrayResource resource = new ByteArrayResource(data);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cvDto.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .body(resource);
    }

    @DeleteMapping("/{cvId}")
    public ResponseEntity<Void> deleteCV(@PathVariable Long cvId) {
        cvService.deleteCV(cvId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<CandidateCVDto>> getAllCVs() {
        return ResponseEntity.ok(cvService.getAllCVs());
    }
}
