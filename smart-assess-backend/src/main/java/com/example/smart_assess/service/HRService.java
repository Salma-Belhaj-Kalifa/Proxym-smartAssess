package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateHRRequest;
import com.example.smart_assess.dto.HRDto;

import java.util.List;

public interface HRService {
    HRDto createHR(CreateHRRequest request);
    HRDto updateHR(Long id, CreateHRRequest request);
    void deleteHR(Long id);
    HRDto getHRById(Long id);
    HRDto getHREmail(String email);
    List<HRDto> getAllHRs();
}
