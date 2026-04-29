package com.example.smart_assess.service;

import com.example.smart_assess.entity.TechnicalProfile;
import com.example.smart_assess.entity.CandidateCV;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TechnicalProfileDebugService {
    
    private static final Logger log = LoggerFactory.getLogger(TechnicalProfileDebugService.class);
    
    /**
     * Méthode de debug pour diagnostiquer l'extraction des données du profil technique
     */
    public void debugProfileDataExtraction(TechnicalProfile profile, CandidateCV cv) {
        log.info("=== DEBUG PROFILE DATA EXTRACTION FOR PROFILE {} ===", profile.getId());
        
        if (profile.getParsedData() != null) {
            JsonNode parsedData = profile.getParsedData();
            log.info("ParsedData is not null: {}", parsedData != null);
            
            // Lister tous les champs disponibles
            StringBuilder fields = new StringBuilder();
            parsedData.fieldNames().forEachRemaining(field -> 
                fields.append(field).append(", ")
            );
            log.info("ParsedData keys: {}", fields.toString());
            
            // Vérifier Summary
            if (parsedData.has("Summary")) {
                String summary = parsedData.get("Summary").asText();
                log.info("Found Summary: '{}'", summary);
            } else {
                log.warn("Summary field not found in parsedData");
            }
            
            // Vérifier Technical Information
            if (parsedData.has("Technical Information")) {
                log.info("Technical Information field found");
                JsonNode techInfo = parsedData.get("Technical Information");
                
                // Lister les sous-champs de Technical Information
                StringBuilder techFields = new StringBuilder();
                techInfo.fieldNames().forEachRemaining(field -> 
                    techFields.append(field).append(", ")
                );
                log.info("Technical Information keys: {}", techFields.toString());
                
                if (techInfo.has("Skills")) {
                    JsonNode skillsNode = techInfo.get("Skills");
                    if (skillsNode.isArray()) {
                        List<String> skills = new ArrayList<>();
                        for (JsonNode skill : skillsNode) {
                            skills.add(skill.asText());
                        }
                        log.info("Found {} skills: {}", skills.size(), skills);
                    } else {
                        log.warn("Skills field is not an array: {}", skillsNode.getNodeType());
                        log.warn("Skills field value: {}", skillsNode.asText());
                    }
                } else {
                    log.warn("Skills field not found in Technical Information");
                }
            } else {
                log.warn("Technical Information field not found in parsedData");
            }
            
            // Utiliser les informations de la base de données au lieu du parsed data pour Basic Information
            if (cv.getCandidate() != null) {
                log.info("Using candidate information from database");
                log.info("Candidate ID: {}", cv.getCandidate().getId());
                log.info("Candidate Name: {} {}", cv.getCandidate().getFirstName(), cv.getCandidate().getLastName());
                log.info("Candidate Email: {}", cv.getCandidate().getEmail());
                log.info("Candidate Phone: {}", cv.getCandidate().getPhone());
            } else {
                log.warn("Candidate information not available in CV");
            }
            
            // Afficher la structure complète si possible
            try {
                log.info("Complete parsedData structure: {}", parsedData.toString());
            } catch (Exception e) {
                log.warn("Could not log complete parsedData structure: {}", e.getMessage());
            }
            
        } else {
            log.warn("ParsedData is null for profile ID: {}", profile.getId());
        }
        
        log.info("=== END DEBUG PROFILE DATA EXTRACTION ===");
    }
}
