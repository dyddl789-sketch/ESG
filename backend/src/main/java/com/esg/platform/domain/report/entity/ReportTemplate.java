// 파일 위치: src/main/java/com/esg/platform/domain/report/entity/ReportTemplate.java
package com.esg.platform.domain.report.entity;

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
    private OffsetDateTime createdAt; // [수정] DB의 TIMESTAMPTZ와 매핑
    private OffsetDateTime updatedAt; // [수정] DB의 TIMESTAMPTZ와 매핑
}