package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateHRRequest;
import com.example.smart_assess.dto.HRDto;
import com.example.smart_assess.service.HRService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hrs")
@RequiredArgsConstructor
public class HRController {

    private final HRService hrService;

    @PostMapping
    public ResponseEntity<HRDto> createHR(@Valid @RequestBody CreateHRRequest request) {
        return ResponseEntity.ok(hrService.createHR(request));
    }

    @GetMapping
    public ResponseEntity<List<HRDto>> getAllHRs() {
        return ResponseEntity.ok(hrService.getAllHRs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HRDto> getHRById(@PathVariable Long id) {
        return ResponseEntity.ok(hrService.getHRById(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<HRDto> getHREmail(@PathVariable String email) {
        return ResponseEntity.ok(hrService.getHREmail(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HRDto> updateHR(@PathVariable Long id, @Valid @RequestBody CreateHRRequest request) {
        return ResponseEntity.ok(hrService.updateHR(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHR(@PathVariable Long id) {
        hrService.deleteHR(id);
        return ResponseEntity.noContent().build();
    }
}
