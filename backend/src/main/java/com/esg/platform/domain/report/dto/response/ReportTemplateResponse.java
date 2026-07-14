// 파일 위치: src/main/java/com/esg/platform/domain/report/dto/response/ReportTemplateResponse.java
package com.esg.platform.domain.report.dto.response;

import com.esg.platform.domain.report.entity.ReportTemplate;
import lombok.Builder;
import lombok.Getter;
import java.time.OffsetDateTime; // [수정]

@Getter
@Builder
public class ReportTemplateResponse {
    private Long id;
    private Long companyId;
    private String title;
    private String content;
    private String includedIndicators;
    private String layoutSettings;
    private OffsetDateTime createdAt; // [수정]

    public static ReportTemplateResponse from(ReportTemplate entity) {
        return ReportTemplateResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .includedIndicators(entity.getIncludedIndicators())
                .layoutSettings(entity.getLayoutSettings())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}