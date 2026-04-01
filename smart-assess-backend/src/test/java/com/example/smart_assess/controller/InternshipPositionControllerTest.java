package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateInternshipPositionRequest;
import com.example.smart_assess.dto.InternshipPositionDto;
import com.example.smart_assess.dto.TogglePositionStatusRequest;
import com.example.smart_assess.service.InternshipPositionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
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
@DisplayName("InternshipPositionController Tests")
class InternshipPositionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InternshipPositionService positionService;

    private InternshipPositionDto positionDto;
    private CreateInternshipPositionRequest createRequest;

    @BeforeEach
    void setUp() {
        positionDto = InternshipPositionDto.builder()
                .id(1L)
                .title("Stage Backend Java")
                .company("Proxym IT")
                .description("Développement Spring Boot")
                .requiredSkills(List.of("Java", "Spring Boot"))
                .acceptedDomains(List.of("Informatique"))
                .isActive(true)
                .createdBy(5L)
                .createdByEmail("manager@proxym.com")
                .createdAt(LocalDateTime.now())
                .build();

        createRequest = new CreateInternshipPositionRequest();
        createRequest.setTitle("Stage Backend Java");
        createRequest.setCompany("Proxym IT");
        createRequest.setDescription("Développement Spring Boot");
        createRequest.setRequiredSkills(List.of("Java", "Spring Boot"));
        createRequest.setAcceptedDomains(List.of("Informatique"));
        createRequest.setIsActive(true);
    }

    // ============ POST /api/positions ============

    @Test
    @DisplayName("POST /positions - crée une position (manager authentifié)")
    @WithMockUser(username = "manager@proxym.com", roles = "MANAGER")
    void createPosition_AsManager_ShouldReturn200() throws Exception {
        when(positionService.createPosition(any(CreateInternshipPositionRequest.class), eq("manager@proxym.com")))
                .thenReturn(positionDto);

        mockMvc.perform(post("/api/positions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("Stage Backend Java"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    // ============ GET /api/positions ============

    @Test
    @DisplayName("GET /positions - retourne toutes les positions")
    void getAllPositions_ShouldReturn200() throws Exception {
        when(positionService.getAllPositions()).thenReturn(List.of(positionDto));

        mockMvc.perform(get("/api/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Stage Backend Java"));
    }

    @Test
    @DisplayName("GET /positions - retourne liste vide")
    void getAllPositions_WhenEmpty_ShouldReturnEmptyList() throws Exception {
        when(positionService.getAllPositions()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ============ GET /api/positions/public ============

    @Test
    @DisplayName("GET /positions/public - retourne uniquement les positions actives")
    void getPublicPositions_ShouldReturnActive() throws Exception {
        when(positionService.getActivePositions()).thenReturn(List.of(positionDto));

        mockMvc.perform(get("/api/positions/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].isActive").value(true));
    }

    // ============ GET /api/positions/active ============

    @Test
    @DisplayName("GET /positions/active - retourne les positions actives")
    void getActivePositions_ShouldReturn200() throws Exception {
        when(positionService.getActivePositions()).thenReturn(List.of(positionDto));

        mockMvc.perform(get("/api/positions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ============ GET /api/positions/{id} ============

    @Test
    @DisplayName("GET /positions/{id} - retourne la position par ID")
    void getPositionById_ShouldReturn200() throws Exception {
        when(positionService.getPositionById(1L)).thenReturn(positionDto);

        mockMvc.perform(get("/api/positions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("Stage Backend Java"))
                .andExpect(jsonPath("$.company").value("Proxym IT"));
    }

    @Test
    @DisplayName("GET /positions/{id} - retourne 500 si la position n'existe pas")
    void getPositionById_WhenNotFound_ShouldReturn500() throws Exception {
        when(positionService.getPositionById(99L))
                .thenThrow(new RuntimeException("Position not found"));

        mockMvc.perform(get("/api/positions/99"))
                .andExpect(status().isInternalServerError());
    }

    // ============ GET /api/positions/manager/{managerId} ============

    @Test
    @DisplayName("GET /positions/manager/{managerId} - retourne les positions du manager")
    void getPositionsByManager_ShouldReturn200() throws Exception {
        when(positionService.getPositionsByManager(5L)).thenReturn(List.of(positionDto));

        mockMvc.perform(get("/api/positions/manager/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].createdBy").value(5L));
    }

    // ============ PUT /api/positions/{id} ============

    @Test
    @DisplayName("PUT /positions/{id} - met à jour la position")
    void updatePosition_ShouldReturn200() throws Exception {
        createRequest.setTitle("Stage Fullstack Updated");
        InternshipPositionDto updatedDto = InternshipPositionDto.builder()
                .id(1L)
                .title("Stage Fullstack Updated")
                .company("Proxym IT")
                .isActive(true)
                .build();

        when(positionService.updatePosition(eq(1L), any(CreateInternshipPositionRequest.class)))
                .thenReturn(updatedDto);

        mockMvc.perform(put("/api/positions/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Stage Fullstack Updated"));
    }

    // ============ PATCH /api/positions/{id}/toggle-status ============

    @Test
    @DisplayName("PATCH /positions/{id}/toggle-status - désactive une position")
    void toggleStatus_ToInactive_ShouldReturn200() throws Exception {
        TogglePositionStatusRequest toggleRequest = new TogglePositionStatusRequest(false);

        InternshipPositionDto inactiveDto = InternshipPositionDto.builder()
                .id(1L)
                .title("Stage Backend Java")
                .isActive(false)
                .build();

        when(positionService.togglePositionStatus(eq(1L), eq(false))).thenReturn(inactiveDto);

        mockMvc.perform(patch("/api/positions/1/toggle-status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toggleRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("PATCH /positions/{id}/toggle-status - active une position inactive")
    void toggleStatus_ToActive_ShouldReturn200() throws Exception {
        TogglePositionStatusRequest toggleRequest = new TogglePositionStatusRequest(true);

        InternshipPositionDto activeDto = InternshipPositionDto.builder()
                .id(1L)
                .title("Stage Backend Java")
                .isActive(true)
                .build();

        when(positionService.togglePositionStatus(eq(1L), eq(true))).thenReturn(activeDto);

        mockMvc.perform(patch("/api/positions/1/toggle-status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toggleRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("PATCH /positions/{id}/toggle-status - retourne 500 si position inexistante")
    void toggleStatus_WhenNotFound_ShouldReturn500() throws Exception {
        TogglePositionStatusRequest toggleRequest = new TogglePositionStatusRequest(false);

        when(positionService.togglePositionStatus(eq(99L), any()))
                .thenThrow(new RuntimeException("Position not found with ID: 99"));

        mockMvc.perform(patch("/api/positions/99/toggle-status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toggleRequest)))
                .andExpect(status().isInternalServerError());
    }

    // ============ DELETE /api/positions/{id} ============

    @Test
    @DisplayName("DELETE /positions/{id} - supprime avec succès et retourne 204")
    void deletePosition_ShouldReturn204() throws Exception {
        doNothing().when(positionService).deletePosition(1L);

        mockMvc.perform(delete("/api/positions/1"))
                .andExpect(status().isNoContent());
    }
}