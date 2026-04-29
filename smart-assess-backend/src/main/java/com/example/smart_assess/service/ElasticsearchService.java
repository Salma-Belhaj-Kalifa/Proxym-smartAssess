package com.example.smart_assess.service;

import com.example.smart_assess.dto.ProcessCandidateRequest;
import com.example.smart_assess.dto.ProcessPositionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchService {

    private final WebClient.Builder webClientBuilder;

    @Value("${python.api.base-url:http://localhost:8000}")
    private String pythonApiBaseUrl;

    /**
     * Indexe un candidat dans Elasticsearch via l'API Python
     */
    public Mono<String> indexCandidate(Long candidateId, String summary, java.util.List<String> skills, Integer yearsOfExperience) {
        log.info("Indexing candidate {} in Elasticsearch", candidateId);
        
        // Validation des données pour éviter l'erreur 500 avec embeddings vides
        if (summary == null || summary.trim().isEmpty() || skills == null || skills.isEmpty()) {
            log.warn("Skipping Elasticsearch indexing for candidate {} - empty summary or skills", candidateId);
            log.warn("Summary: '{}', Skills: {}, Summary length: {}, Skills count: {}", 
                summary, skills, 
                summary != null ? summary.length() : 0, 
                skills != null ? skills.size() : 0);
            return Mono.just("Skipped indexing - empty data");
        }

        ProcessCandidateRequest request = new ProcessCandidateRequest();
        request.setCandidate_id(candidateId);
        request.setSkills(skills);
        request.setSummary(summary); // Utiliser summary au lieu de cv_text
        request.setYearsOfExperience(yearsOfExperience);

        log.info("=== DEBUG ELASTICSEARCH REQUEST ===");
        log.info("Candidate ID: {}", candidateId);
        log.info("Summary: '{}'", summary);
        log.info("Skills: {}", skills);
        log.info("Years of Experience: {}", yearsOfExperience);
        log.info("Summary length: {}", summary.length());
        log.info("Skills count: {}", skills.size());

        return webClientBuilder.build()
            .post()
            .uri(pythonApiBaseUrl + "/api/v1/process-candidate")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofMinutes(2))
            .doOnSuccess(response -> log.info("Candidate {} indexed successfully: {}", candidateId, response))
            .doOnError(error -> log.error("Error indexing candidate {}: {}", candidateId, error.getMessage()));
    }

    /**
     * Indexe un poste dans Elasticsearch via l'API Python
     */
    public Mono<String> indexPosition(Long positionId, String title, String description, 
                                     String requirements, java.util.List<String> requiredSkills) {
        log.info("Indexing position {} in Elasticsearch", positionId);

        ProcessPositionRequest request = new ProcessPositionRequest();
        request.setPosition_id(positionId);
        request.setTitle(title);
        request.setDescription(description);
        request.setRequirements(requirements);
        request.setRequiredSkills(requiredSkills);
        
        // Logs détaillés pour diagnostiquer
        log.info("=== PYTHON API REQUEST ===");
        log.info("Position ID: {}", positionId);
        log.info("Title: {}", title);
        log.info("Description: {}", description);
        log.info("Requirements: '{}'", requirements);
        log.info("RequiredSkills: {}", requiredSkills);
        log.info("RequiredSkills type: {}", requiredSkills != null ? requiredSkills.getClass().getSimpleName() : "null");
        log.info("Request object: {}", request);

        return webClientBuilder.build()
            .post()
            .uri(pythonApiBaseUrl + "/api/v1/process-position")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofMinutes(2))
            .doOnSuccess(response -> log.info("Position {} indexed successfully: {}", positionId, response))
            .doOnError(error -> log.error("Error indexing position {}: {}", positionId, error.getMessage()));
    }

    /**
     * Calcule le score de matching ciblé pour un candidat
     */
    public Mono<Map<String, Object>> computeTargetedMatching(Long candidateId) {
        log.info("Computing targeted matching for candidate {}", candidateId);

        Map<String, Object> request = new HashMap<>();
        request.put("candidate_id", candidateId);

        return webClientBuilder.build()
            .post()
            .uri(pythonApiBaseUrl + "/api/v1/compute-score-cible")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
            .timeout(Duration.ofMinutes(3))
            .doOnSuccess(response -> log.info("Targeted matching computed for candidate {}: {}", candidateId, response))
            .doOnError(error -> log.error("Error computing targeted matching for candidate {}: {}", candidateId, error.getMessage()));
    }

    /**
     * Met à jour le best match d'un candidat dans Elasticsearch
     */
    public Mono<String> updateBestMatch(Long candidateId, Long bestMatchPositionId, String bestMatchTitle, Double bestMatchScore) {
        log.info("Updating best match for candidate {}: position {} with score {}", candidateId, bestMatchPositionId, bestMatchScore);

        Map<String, Object> request = new HashMap<>();
        request.put("candidate_id", candidateId);
        request.put("best_match_position_id", bestMatchPositionId);
        request.put("best_match_title", bestMatchTitle);
        request.put("best_match_score", bestMatchScore);

        return webClientBuilder.build()
            .put()
            .uri(pythonApiBaseUrl + "/api/v1/update-best-match")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofMinutes(1))
            .doOnSuccess(response -> log.info("Best match updated for candidate {}: {}", candidateId, response))
            .doOnError(error -> log.error("Error updating best match for candidate {}: {}", candidateId, error.getMessage()));
    }

    /**
     * Supprime un candidat d'Elasticsearch
     */
    public Mono<String> deleteCandidate(Long candidateId) {
        log.info("Deleting candidate {} from Elasticsearch", candidateId);

        return webClientBuilder.build()
            .delete()
            .uri(pythonApiBaseUrl + "/api/v1/candidate/" + candidateId)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofMinutes(1))
            .doOnSuccess(response -> log.info("Candidate {} deleted from Elasticsearch: {}", candidateId, response))
            .doOnError(error -> log.error("Error deleting candidate {} from Elasticsearch: {}", candidateId, error.getMessage()));
    }

    /**
     * Supprime un poste d'Elasticsearch
     */
    public Mono<String> deletePosition(Long positionId) {
        log.info("Deleting position {} from Elasticsearch", positionId);

        return webClientBuilder.build()
            .delete()
            .uri(pythonApiBaseUrl + "/api/v1/position/" + positionId)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofMinutes(1))
            .doOnSuccess(response -> log.info("Position {} deleted from Elasticsearch: {}", positionId, response))
            .doOnError(error -> log.error("Error deleting position {} from Elasticsearch: {}", positionId, error.getMessage()));
    }

    /**
     * Vérifie si un candidat existe dans Elasticsearch
     */
    public Mono<Boolean> candidateExists(Long candidateId) {
        log.info("Checking if candidate {} exists in Elasticsearch", candidateId);

        return webClientBuilder.build()
            .get()
            .uri(pythonApiBaseUrl + "/api/v1/candidate/" + candidateId + "/exists")
            .retrieve()
            .bodyToMono(Boolean.class)
            .timeout(Duration.ofMinutes(1))
            .doOnSuccess(exists -> log.info("Candidate {} exists in Elasticsearch: {}", candidateId, exists))
            .doOnError(error -> log.error("Error checking if candidate {} exists: {}", candidateId, error.getMessage()));
    }

    /**
     * Met à jour un document candidat dans Elasticsearch
     */
    public Mono<String> updateCandidate(Long candidateId, Map<String, Object> updateData) {
        log.info("Updating candidate {} in Elasticsearch with data: {}", candidateId, updateData);

        Map<String, Object> request = new HashMap<>();
        request.put("candidate_id", candidateId);
        request.put("update_data", updateData);

        return webClientBuilder.build()
            .put()
            .uri(pythonApiBaseUrl + "/api/v1/candidate/" + candidateId + "/update")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofMinutes(2))
            .doOnSuccess(response -> log.info("Candidate {} updated successfully: {}", candidateId, response))
            .doOnError(error -> log.error("Error updating candidate {}: {}", candidateId, error.getMessage()));
    }

    /**
     * Vérifie si un poste existe dans Elasticsearch
     */
    public Mono<Boolean> positionExists(Long positionId) {
        log.info("Checking if position {} exists in Elasticsearch", positionId);

        return webClientBuilder.build()
            .get()
            .uri(pythonApiBaseUrl + "/api/v1/position/" + positionId + "/exists")
            .retrieve()
            .bodyToMono(Boolean.class)
            .timeout(Duration.ofMinutes(1))
            .doOnSuccess(exists -> log.info("Position {} exists in Elasticsearch: {}", positionId, exists))
            .doOnError(error -> log.error("Error checking if position {} exists: {}", positionId, error.getMessage()));
    }
}
