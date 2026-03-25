package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.ManagerDto;
import com.example.smart_assess.dto.UpdateProfileRequest;

import java.util.List;

public interface ManagerService {
    ManagerDto createManager(CreateManagerRequest request);
    ManagerDto updateManager(Long id, CreateManagerRequest request);
    ManagerDto updateProfile(Long id, UpdateProfileRequest request);
    void deleteManager(Long id);
    void deleteMyProfile();
    ManagerDto getManagerById(Long id);
    ManagerDto getManagerByEmail(String email);
    List<ManagerDto> getAllManagers();
    
    // Vérifier si l'utilisateur est le propriétaire du profil
    boolean isOwner(Long managerId, String email);
}
