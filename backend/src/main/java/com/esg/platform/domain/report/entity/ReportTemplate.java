package com.esg.platform.domain.report.entity;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ReportTemplate {
    private Long id;
    private Long companyId;
    private String title;
    private String includedIndicators; // PostgreSQL JSONB (String 매핑)
    private String layoutSettings;     // PostgreSQL JSONB (String 매핑)
    private LocalDateTime createdAt;
}