package com.esg.platform.domain.report.dto.response;

import com.esg.platform.domain.report.entity.ReportTemplate;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class ReportTemplateResponse {
    private Long id;
    private Long companyId;
    private String title;
    private String includedIndicators;
    private String layoutSettings;
    private LocalDateTime createdAt;

    public static ReportTemplateResponse from(ReportTemplate entity) {
        return ReportTemplateResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .title(entity.getTitle())
                .includedIndicators(entity.getIncludedIndicators())
                .layoutSettings(entity.getLayoutSettings())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}