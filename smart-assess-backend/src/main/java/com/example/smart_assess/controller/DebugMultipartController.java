package com.example.smart_assess.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@Slf4j
public class DebugMultipartController {

    @PostMapping("/test-multipart-simple")
    public ResponseEntity<Map<String, Object>> testMultipartSimple(
            @RequestParam(name = "file", required = false) MultipartFile file,
            HttpServletRequest request) {
        
        log.info("=== DEBUG SIMPLE MULTIPART ===");
        log.info("Request method: {}", request.getMethod());
        log.info("Request content type: {}", request.getContentType());
        log.info("Request content length: {}", request.getContentLength());
        log.info("Parameter names: {}", String.join(", ", request.getParameterMap().keySet()));
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (file != null) {
                log.info("File received: {}", file.getOriginalFilename());
                log.info("File size: {}", file.getSize());
                log.info("File type: {}", file.getContentType());
                log.info("File empty: {}", file.isEmpty());
                
                result.put("success", true);
                result.put("fileName", file.getOriginalFilename());
                result.put("fileSize", file.getSize());
                result.put("contentType", file.getContentType());
                result.put("isEmpty", file.isEmpty());
                result.put("message", "Simple multipart test successful");
                
                log.info("Simple multipart test completed successfully");
                
                return ResponseEntity.ok(result);
            } else {
                log.warn("No file received in request");
                result.put("success", false);
                result.put("error", "No file received");
                result.put("contentType", request.getContentType());
                result.put("parameters", request.getParameterMap().keySet());
                
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Error in simple multipart test", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(result);
        }
    }
}
