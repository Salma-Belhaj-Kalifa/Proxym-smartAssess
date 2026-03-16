package com.example.smart_assess.dto;

import com.example.smart_assess.enums.ParsingStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class CandidateCVDto {
    private Long id;
    private Long candidateId;
    private String fileName;
    private Long fileSizeBytes;
    private ParsingStatus parsingStatus;
    private LocalDateTime uploadDate;
}
