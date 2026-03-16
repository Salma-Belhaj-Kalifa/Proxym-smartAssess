package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.ManagerDto;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.service.ManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerServiceImpl implements ManagerService {

    private final ManagerRepository managerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ManagerDto createManager(CreateManagerRequest request) {
        if (managerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Manager manager = new Manager();
        manager.setEmail(request.getEmail());
        manager.setPassword(passwordEncoder.encode(request.getPassword()));
        manager.setFirstName(request.getFirstName());
        manager.setLastName(request.getLastName());
        manager.setDepartment(request.getDepartment());
        manager.setRole(Role.MANAGER);

        manager = managerRepository.save(manager);
        return toDto(manager);
    }

    @Override
    public ManagerDto updateManager(Long id, CreateManagerRequest request) {
        Manager manager = managerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        manager.setFirstName(request.getFirstName());
        manager.setLastName(request.getLastName());
        manager.setDepartment(request.getDepartment());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            manager.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        manager = managerRepository.save(manager);
        return toDto(manager);
    }

    @Override
    public void deleteManager(Long id) {
        Manager manager = managerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        managerRepository.delete(manager);
    }

    @Override
    public ManagerDto getManagerById(Long id) {
        Manager manager = managerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        return toDto(manager);
    }

    @Override
    public ManagerDto getManagerByEmail(String email) {
        Manager manager = managerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        return toDto(manager);
    }

    @Override
    public List<ManagerDto> getAllManagers() {
        return managerRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ManagerDto toDto(Manager manager) {
        return ManagerDto.builder()
                .id(manager.getId())
                .email(manager.getEmail())
                .firstName(manager.getFirstName())
                .lastName(manager.getLastName())
                .department(manager.getDepartment())
                .createdAt(manager.getCreatedAt())
                .build();
    }
}
