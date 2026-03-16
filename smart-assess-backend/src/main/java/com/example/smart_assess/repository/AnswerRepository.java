package com.example.smart_assess.repository;

import com.example.smart_assess.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByTestSession_Id(Long testSessionId);
    List<Answer> findByQuestion_Id(Long questionId);
}
