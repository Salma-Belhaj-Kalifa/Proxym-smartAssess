package com.example.smart_assess.service;

import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.NotificationMessage;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.GeneratedTest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyNewCandidature(CandidatureDto candidature) {
        // Extraire les titres des postes depuis la liste des positions
        List<String> positionTitles = new ArrayList<>();
        if (candidature.getPositions() != null) {
            positionTitles = candidature.getPositions().stream()
                    .map(position -> position.getTitle())
                    .collect(Collectors.toList());
        } else if (candidature.getPositionTitle() != null) {
            // Fallback pour compatibilité avec l'ancien champ
            positionTitles.add(candidature.getPositionTitle());
        }
        
        NotificationMessage message = NotificationMessage.builder()
                .type("NEW_CANDIDATURE")
                .timestamp(LocalDateTime.now())
                .data(Map.of(
                    "candidatureId", candidature.getId(),
                    "candidateId", candidature.getCandidateId(),
                    "candidateName", candidature.getCandidateFirstName() + " " + candidature.getCandidateLastName(),
                    "candidateEmail", candidature.getCandidateEmail(),
                    "positions", positionTitles,
                    "company", candidature.getPositionCompany(),
                    "status", candidature.getStatus()
                ))
                .build();

        messagingTemplate.convertAndSend("/topic/manager-notifications", message);
        log.info("🔔 Notification sent: New candidature from {} for positions {}", 
                candidature.getCandidateFirstName() + " " + candidature.getCandidateLastName(), 
                positionTitles);
    }

    public void notifyTestSubmitted(GeneratedTest test, Candidate candidate) {
        NotificationMessage message = NotificationMessage.builder()
                .type("TEST_SUBMITTED")
                .timestamp(LocalDateTime.now())
                .data(Map.of(
                    "testId", test.getId(),
                    "candidateId", candidate.getId(),
                    "candidateName", candidate.getFirstName() + " " + candidate.getLastName(),
                    "candidateEmail", candidate.getEmail(),
                    "status", test.getStatus(),
                    "submittedAt", test.getSubmittedAt()
                ))
                .build();

        messagingTemplate.convertAndSend("/topic/manager-notifications", message);
        log.info("🔔 Notification sent: Test submitted by {}", 
                candidate.getFirstName() + " " + candidate.getLastName());
    }

    public void notifyTestCompleted(GeneratedTest test, Candidate candidate) {
        NotificationMessage message = NotificationMessage.builder()
                .type("TEST_COMPLETED")
                .timestamp(LocalDateTime.now())
                .data(Map.of(
                    "testId", test.getId(),
                    "candidateId", candidate.getId(),
                    "candidateName", candidate.getFirstName() + " " + candidate.getLastName(),
                    "candidateEmail", candidate.getEmail(),
                    "status", test.getStatus(),
                    "completedAt", test.getSubmittedAt() // Utiliser submittedAt car completedAt n'existe pas
                ))
                .build();

        messagingTemplate.convertAndSend("/topic/manager-notifications", message);
        log.info("🔔 Notification sent: Test completed by {}", 
                candidate.getFirstName() + " " + candidate.getLastName());
    }
}
