package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.ChangePasswordRequest;
import com.example.smart_assess.dto.CreateUserRequest;
import com.example.smart_assess.dto.UpdateUserRequest;
import com.example.smart_assess.dto.UserDto;
import com.example.smart_assess.entity.*;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.*;
import com.example.smart_assess.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final ManagerRepository managerRepository;
    private final HRRepository hrRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = switch (request.getRole()) {
            case CANDIDATE -> {
                Candidate candidate = new Candidate();
                candidate.setEmail(request.getEmail());
                candidate.setPassword(passwordEncoder.encode(request.getPassword()));
                candidate.setFirstName(request.getFirstName());
                candidate.setLastName(request.getLastName());
                candidate.setRole(request.getRole());
                yield candidateRepository.save(candidate);
            }
            case MANAGER -> {
                Manager manager = new Manager();
                manager.setEmail(request.getEmail());
                manager.setPassword(passwordEncoder.encode(request.getPassword()));
                manager.setFirstName(request.getFirstName());
                manager.setLastName(request.getLastName());
                manager.setRole(request.getRole());
                yield managerRepository.save(manager);
            }
            case HR -> {
                HR hr = new HR();
                hr.setEmail(request.getEmail());
                hr.setPassword(passwordEncoder.encode(request.getPassword()));
                hr.setFirstName(request.getFirstName());
                hr.setLastName(request.getLastName());
                hr.setRole(request.getRole());
                yield hrRepository.save(hr);
            }
        };

        return toDto(user);
    }

    @Override
    public UserDto updateUser(Long id, CreateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        return toDto(user);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    @Override
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    @Override
    public List<UserDto> getAllUsers() {
        log.info("Getting all users from database");
        try {
            // Get users from all child tables to avoid Hibernate inheritance issues
            List<User> users = new java.util.ArrayList<>();
            users.addAll(candidateRepository.findAll());
            users.addAll(managerRepository.findAll());
            users.addAll(hrRepository.findAll());
            
            log.info("Found {} users in database (candidates: {}, managers: {}, hrs: {})", 
                    users.size(), 
                    candidateRepository.count(),
                    managerRepository.count(),
                    hrRepository.count());
            
            List<UserDto> userDtos = users.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            
            log.info("Converted {} users to DTOs", userDtos.size());
            return userDtos;
        } catch (Exception e) {
            log.error("Error getting all users", e);
            throw e;
        }
    }

    @Override
    public List<UserDto> getUsersByRole(Role role) {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto updateUserProfile(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Mettre à jour les champs communs
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        // Mettre à jour les champs spécifiques selon le rôle
        switch (user.getRole()) {
            case CANDIDATE:
                if (user instanceof Candidate candidate && request.getPhone() != null) {
                    candidate.setPhone(request.getPhone());
                }
                break;
            case MANAGER:
                if (user instanceof Manager manager && request.getDepartment() != null) {
                    manager.setDepartment(request.getDepartment());
                }
                break;
            case HR:
                if (user instanceof HR hr && request.getDepartment() != null) {
                    hr.setDepartment(request.getDepartment());
                }
                break;
        }

        user = userRepository.save(user);
        return toDto(user);
    }

    private UserDto toDto(User user) {
        UserDto.UserDtoBuilder builder = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt());

        // Ajouter les champs spécifiques selon le rôle
        switch (user.getRole()) {
            case CANDIDATE:
                if (user instanceof Candidate candidate) {
                    builder.phone(candidate.getPhone());
                }
                break;
            case MANAGER:
                if (user instanceof Manager manager) {
                    builder.department(manager.getDepartment());
                }
                break;
            case HR:
                if (user instanceof HR hr) {
                    builder.department(hr.getDepartment());
                }
                break;
        }

        return builder.build();
    }

    @Override
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Vérifier que le mot de passe actuel est correct
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Le mot de passe actuel est incorrect");
        }

        // Vérifier que le nouveau mot de passe est différent
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("Le nouveau mot de passe doit être différent de l'ancien");
        }

        // Mettre à jour le mot de passe
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
