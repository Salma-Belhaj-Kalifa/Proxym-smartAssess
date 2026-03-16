package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.ManagerDto;

import java.util.List;

public interface ManagerService {
    ManagerDto createManager(CreateManagerRequest request);
    ManagerDto updateManager(Long id, CreateManagerRequest request);
    void deleteManager(Long id);
    ManagerDto getManagerById(Long id);
    ManagerDto getManagerByEmail(String email);
    List<ManagerDto> getAllManagers();
}
