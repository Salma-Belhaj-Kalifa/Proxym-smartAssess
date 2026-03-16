package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.ManagerDto;
import com.example.smart_assess.service.ManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/managers")
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;

    @PostMapping
    public ResponseEntity<ManagerDto> createManager(@Valid @RequestBody CreateManagerRequest request) {
        return ResponseEntity.ok(managerService.createManager(request));
    }

    @GetMapping
    public ResponseEntity<List<ManagerDto>> getAllManagers() {
        return ResponseEntity.ok(managerService.getAllManagers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ManagerDto> getManagerById(@PathVariable Long id) {
        return ResponseEntity.ok(managerService.getManagerById(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<ManagerDto> getManagerByEmail(@PathVariable String email) {
        return ResponseEntity.ok(managerService.getManagerByEmail(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ManagerDto> updateManager(@PathVariable Long id, @Valid @RequestBody CreateManagerRequest request) {
        return ResponseEntity.ok(managerService.updateManager(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteManager(@PathVariable Long id) {
        managerService.deleteManager(id);
        return ResponseEntity.noContent().build();
    }
}
