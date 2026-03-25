package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.ManagerDto;
import com.example.smart_assess.dto.UpdateProfileRequest;
import com.example.smart_assess.service.ManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/managers")
@RequiredArgsConstructor
@Slf4j
public class ManagerController {

    private final ManagerService managerService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<ManagerDto> createManager(@Valid @RequestBody CreateManagerRequest request) {
        return ResponseEntity.ok(managerService.createManager(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<List<ManagerDto>> getAllManagers() {
        return ResponseEntity.ok(managerService.getAllManagers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR') or @managerService.isOwner(#id, authentication.name)")
    public ResponseEntity<ManagerDto> getManagerById(@PathVariable Long id) {
        return ResponseEntity.ok(managerService.getManagerById(id));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR') or authentication.name == #email")
    public ResponseEntity<ManagerDto> getManagerByEmail(@PathVariable String email) {
        return ResponseEntity.ok(managerService.getManagerByEmail(email));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR') or @managerService.isOwner(#id, authentication.name)")
    public ResponseEntity<ManagerDto> updateManager(@PathVariable Long id, @Valid @RequestBody CreateManagerRequest request) {
        return ResponseEntity.ok(managerService.updateManager(id, request));
    }

    @PutMapping("/{id}/profile")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR') or @managerService.isOwner(#id, authentication.name)")
    public ResponseEntity<ManagerDto> updateProfile(@PathVariable Long id, @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(managerService.updateProfile(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Map<String, Object>> deleteManager(@PathVariable Long id) {
        try {
            log.info("HR deletion request for manager ID: {}", id);
            managerService.deleteManager(id);
            log.info("Manager {} deleted successfully by HR", id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Manager supprimé avec succès"
            ));
        } catch (Exception e) {
            log.error("Error deleting manager {}: {}", id, e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> deleteMyProfile() {
        try {
            // Récupérer l'ID du manager depuis le token JWT
            // Cette méthode sera implémentée dans le service
            log.info("Self-deletion request from manager");
            managerService.deleteMyProfile();
            log.info("Manager self-deleted successfully");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Votre profil a été supprimé avec succès"
            ));
        } catch (Exception e) {
            log.error("Error in manager self-deletion: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}
