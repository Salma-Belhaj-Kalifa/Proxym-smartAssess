package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.CreateCandidatureRequest;
import com.example.smart_assess.dto.UpdateCandidatureStatusRequest;
import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.service.CandidatureService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CandidatureController Tests")
class CandidatureControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CandidatureService candidatureService;

    private CandidatureDto candidatureDto;

    @BeforeEach
    void setUp() {
        candidatureDto = CandidatureDto.builder()
                .id(1L)
                .candidateId(10L)
                .candidateFirstName("Ali")
                .candidateLastName("Ben")
                .candidateEmail("ali@proxym.com")
                .status(CandidatureStatus.PENDING)
                .appliedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .positions(Collections.emptyList())
                .build();
    }

    // ============ POST /api/candidatures ============

    @Test
    @DisplayName("POST /candidatures - crée une candidature avec succès")
    void createCandidature_ShouldReturn200() throws Exception {
        CreateCandidatureRequest request = new CreateCandidatureRequest();
        request.setCandidateId(10L);
        request.setPositionIds(List.of(5L));

        when(candidatureService.createCandidature(any(CreateCandidatureRequest.class)))
                .thenReturn(candidatureDto);

        mockMvc.perform(post("/api/candidatures")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.candidateFirstName").value("Ali"));
    }

    // ============ GET /api/candidatures ============

    @Test
    @DisplayName("GET /candidatures - retourne toutes les candidatures")
    void getAllCandidatures_ShouldReturn200() throws Exception {
        when(candidatureService.getAllCandidatures()).thenReturn(List.of(candidatureDto));

        mockMvc.perform(get("/api/candidatures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    @DisplayName("GET /candidatures - retourne liste vide si aucune candidature")
    void getAllCandidatures_WhenEmpty_ShouldReturnEmptyList() throws Exception {
        when(candidatureService.getAllCandidatures()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/candidatures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ============ GET /api/candidatures/{id} ============

    @Test
    @DisplayName("GET /candidatures/{id} - retourne la candidature par ID")
    void getCandidatureById_ShouldReturn200() throws Exception {
        when(candidatureService.getCandidatureById(1L)).thenReturn(candidatureDto);

        mockMvc.perform(get("/api/candidatures/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.candidateEmail").value("ali@proxym.com"));
    }

    @Test
    @DisplayName("GET /candidatures/{id} - retourne 500 si la candidature n'existe pas")
    void getCandidatureById_WhenNotFound_ShouldReturn500() throws Exception {
        when(candidatureService.getCandidatureById(99L))
                .thenThrow(new RuntimeException("Candidature not found"));

        mockMvc.perform(get("/api/candidatures/99"))
                .andExpect(status().isInternalServerError());
    }

    // ============ GET /api/candidatures/candidate/{candidateId} ============

    @Test
    @DisplayName("GET /candidatures/candidate/{candidateId} - retourne les candidatures du candidat")
    void getCandidaturesByCandidate_ShouldReturn200() throws Exception {
        when(candidatureService.getCandidaturesByCandidate(10L))
                .thenReturn(List.of(candidatureDto));

        mockMvc.perform(get("/api/candidatures/candidate/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].candidateId").value(10L));
    }

    @Test
    @DisplayName("GET /candidatures/candidate/{candidateId} - retourne liste vide si aucune candidature")
    void getCandidaturesByCandidate_WhenEmpty_ShouldReturnEmptyList() throws Exception {
        when(candidatureService.getCandidaturesByCandidate(99L))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/candidatures/candidate/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ============ GET /api/candidatures/position/{positionId} ============

    @Test
    @DisplayName("GET /candidatures/position/{positionId} - retourne les candidatures par poste")
    void getCandidaturesByPosition_ShouldReturn200() throws Exception {
        when(candidatureService.getCandidaturesByPosition(5L))
                .thenReturn(List.of(candidatureDto));

        mockMvc.perform(get("/api/candidatures/position/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ============ GET /api/candidatures/status/{status} ============

    @Test
    @DisplayName("GET /candidatures/status/PENDING - retourne les candidatures en attente")
    void getCandidaturesByStatus_Pending_ShouldReturn200() throws Exception {
        when(candidatureService.getCandidaturesByStatus(CandidatureStatus.PENDING))
                .thenReturn(List.of(candidatureDto));

        mockMvc.perform(get("/api/candidatures/status/PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /candidatures/status/ACCEPTED - retourne liste vide si aucune acceptée")
    void getCandidaturesByStatus_Accepted_WhenEmpty_ShouldReturnEmpty() throws Exception {
        when(candidatureService.getCandidaturesByStatus(CandidatureStatus.ACCEPTED))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/candidatures/status/ACCEPTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ============ PUT /api/candidatures/{id}/status ============

    @Test
    @DisplayName("PUT /candidatures/{id}/status - met à jour le statut vers ACCEPTED")
    void updateStatus_ToAccepted_ShouldReturn200() throws Exception {
        UpdateCandidatureStatusRequest request = new UpdateCandidatureStatusRequest();
        request.setStatus(CandidatureStatus.ACCEPTED);

        CandidatureDto acceptedDto = CandidatureDto.builder()
                .id(1L)
                .candidateId(10L)
                .status(CandidatureStatus.ACCEPTED)
                .positions(Collections.emptyList())
                .build();

        when(candidatureService.updateStatus(eq(1L), any(UpdateCandidatureStatusRequest.class)))
                .thenReturn(acceptedDto);

        mockMvc.perform(put("/api/candidatures/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/status - met à jour le statut vers REJECTED avec raison")
    void updateStatus_ToRejected_WithReason_ShouldReturn200() throws Exception {
        UpdateCandidatureStatusRequest request = new UpdateCandidatureStatusRequest();
        request.setStatus(CandidatureStatus.REJECTED);
        request.setRejectionReason("Profil insuffisant");

        CandidatureDto rejectedDto = CandidatureDto.builder()
                .id(1L)
                .candidateId(10L)
                .status(CandidatureStatus.REJECTED)
                .rejectionReason("Profil insuffisant")
                .positions(Collections.emptyList())
                .build();

        when(candidatureService.updateStatus(eq(1L), any(UpdateCandidatureStatusRequest.class)))
                .thenReturn(rejectedDto);

        mockMvc.perform(put("/api/candidatures/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Profil insuffisant"));
    }

    @Test
    @DisplayName("PUT /candidatures/{id}/status - retourne 500 si la candidature n'existe pas")
    void updateStatus_WhenNotFound_ShouldReturn500() throws Exception {
        UpdateCandidatureStatusRequest request = new UpdateCandidatureStatusRequest();
        request.setStatus(CandidatureStatus.ACCEPTED);

        when(candidatureService.updateStatus(eq(99L), any()))
                .thenThrow(new RuntimeException("Candidature not found"));

        mockMvc.perform(put("/api/candidatures/99/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    // ============ DELETE /api/candidatures/{id} ============

    @Test
    @DisplayName("DELETE /candidatures/{id} - supprime avec succès et retourne 204")
    void deleteCandidature_ShouldReturn204() throws Exception {
        doNothing().when(candidatureService).deleteCandidature(1L);

        mockMvc.perform(delete("/api/candidatures/1"))
                .andExpect(status().isNoContent());
    }
}