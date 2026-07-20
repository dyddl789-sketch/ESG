package com.esg.platform.domain.reportbuild.entity;

import lombok.*;
import java.time.OffsetDateTime; // [핵심] LocalDateTime 대신 OffsetDateTime 사용

@Getter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ReportTemplate {
    private Long id;
    private Long companyId;
    private String title;
    private String content;
    private String includedIndicators;
    private String layoutSettings;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}