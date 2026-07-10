// 파일 위치: src/main/java/com/esg/platform/domain/report/dto/response/ReportResponse.java
package com.esg.platform.domain.report.dto.response;

import com.esg.platform.domain.report.entity.GeneratedReport;
import lombok.Builder;
import lombok.Getter;
import java.time.OffsetDateTime; // [수정]

@Getter
@Builder
public class ReportResponse {
    private Long id;
    private Long templateId;
    private String title;
    private String content;
    private String version;
    private String fileUrl;
    private Boolean isPublic;
    private Long generatedBy;
    private OffsetDateTime createdAt; // [수정]

    public static ReportResponse from(GeneratedReport entity) {
        return ReportResponse.builder()
                .id(entity.getId())
                .templateId(entity.getTemplateId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .version(entity.getVersion())
                .fileUrl(entity.getFileUrl())
                .isPublic(entity.getIsPublic())
                .generatedBy(entity.getGeneratedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}