package com.example.smart_assess.repository;

import com.example.smart_assess.entity.InternshipPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternshipPositionRepository extends JpaRepository<InternshipPosition, Long> {
    List<InternshipPosition> findByIsActiveTrue();
    List<InternshipPosition> findByCreatedBy_Id(Long managerId);
}
