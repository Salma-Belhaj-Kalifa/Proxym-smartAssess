package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateHRRequest;
import com.example.smart_assess.dto.HRDto;
import com.example.smart_assess.entity.HR;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.HRRepository;
import com.example.smart_assess.service.HRService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HRServiceImpl implements HRService {

    private final HRRepository hrRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public HRDto createHR(CreateHRRequest request) {
        if (hrRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        HR hr = new HR();
        hr.setEmail(request.getEmail());
        hr.setPassword(passwordEncoder.encode(request.getPassword()));
        hr.setFirstName(request.getFirstName());
        hr.setLastName(request.getLastName());
        hr.setDepartment(request.getDepartment());
        hr.setRole(Role.HR);

        hr = hrRepository.save(hr);
        return toDto(hr);
    }

    @Override
    public HRDto updateHR(Long id, CreateHRRequest request) {
        HR hr = hrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HR not found"));

        hr.setFirstName(request.getFirstName());
        hr.setLastName(request.getLastName());
        hr.setDepartment(request.getDepartment());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            hr.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        hr = hrRepository.save(hr);
        return toDto(hr);
    }

    @Override
    public void deleteHR(Long id) {
        HR hr = hrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HR not found"));
        hrRepository.delete(hr);
    }

    @Override
    public HRDto getHRById(Long id) {
        HR hr = hrRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HR not found"));
        return toDto(hr);
    }

    @Override
    public HRDto getHREmail(String email) {
        HR hr = hrRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("HR not found"));
        return toDto(hr);
    }

    @Override
    public List<HRDto> getAllHRs() {
        return hrRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private HRDto toDto(HR hr) {
        return HRDto.builder()
                .id(hr.getId())
                .email(hr.getEmail())
                .firstName(hr.getFirstName())
                .lastName(hr.getLastName())
                .department(hr.getDepartment())
                .createdAt(hr.getCreatedAt())
                .build();
    }
}
