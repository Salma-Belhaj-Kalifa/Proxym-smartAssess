package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.CreateUserRequest;
import com.example.smart_assess.dto.UserDto;
import com.example.smart_assess.service.CandidateService;
import com.example.smart_assess.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    private final UserService userService;
    private final CandidateService candidateService;

    @PostMapping("/create-user")
    public ResponseEntity<Map<String, Object>> createTestUser() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            CreateUserRequest request = new CreateUserRequest();
            request.setEmail("test.candidate@example.com");
            request.setPassword("password123");
            request.setFirstName("Test");
            request.setLastName("Candidate");
            request.setRole(com.example.smart_assess.enums.Role.CANDIDATE);
            
            UserDto user = userService.createUser(request);
            result.put("success", true);
            result.put("user", user);
            
            log.info("Created test user: {}", user.getEmail());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error("Error creating test user", e);
            
            return ResponseEntity.status(500).body(result);
        }
    }

    @PostMapping("/create-candidate")
    public ResponseEntity<Map<String, Object>> createTestCandidate() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            CreateCandidateRequest request = new CreateCandidateRequest();
            request.setEmail("test.candidate2@example.com");
            request.setPassword("password123");
            request.setFirstName("Test");
            request.setLastName("Candidate2");
            request.setPhone("+1234567890");
            
            var candidate = candidateService.createCandidate(request);
            result.put("success", true);
            result.put("candidate", candidate);
            
            log.info("Created test candidate: {}", candidate.getEmail());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error("Error creating test candidate", e);
            
            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/check-data")
    public ResponseEntity<Map<String, Object>> checkData() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            var users = userService.getAllUsers();
            var candidates = candidateService.getAllCandidates();
            
            result.put("usersCount", users.size());
            result.put("candidatesCount", candidates.size());
            result.put("users", users);
            result.put("candidates", candidates);
            
            log.info("Data check - Users: {}, Candidates: {}", users.size(), candidates.size());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("error", e.getMessage());
            log.error("Error checking data", e);
            
            return ResponseEntity.status(500).body(result);
        }
    }
}
