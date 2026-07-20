// 파일 위치: src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportBuildResponse.java
// 버전: v1.1.0
// 기능 요약: 생성된 보고서 데이터를 클라이언트에 반환하는 DTO이며, DB에 적재된 비즈니스 로직 필드(연도, 범위, 회사 ID)를 응답에 누락 없이 포함합니다.
package com.esg.platform.domain.reportbuild.dto.response;

import com.esg.platform.domain.reportbuild.entity.GeneratedReport;
import lombok.Builder;
import lombok.Getter;
import java.time.OffsetDateTime; 

@Getter
@Builder
public class ReportBuildResponse {
    
    /* 기능 요약: 클라이언트 응답 시 반환될 식별자 및 비즈니스 데이터 필드 목록입니다. */
    private Long id;
    private Long companyId;
    private Long templateId;
    private String title;
    private String content;
    private Integer targetYear;
    private String scope;
    private String version;
    private String fileUrl;
    private Boolean isPublic;
    private Long generatedBy;
    private OffsetDateTime createdAt; 

    /* 기능 요약: GeneratedReport 엔티티 객체를 전달받아 ReportBuildResponse DTO로 변환하여 반환합니다. */
    public static ReportBuildResponse from(GeneratedReport entity) {
        System.out.println("[System] ReportBuildResponse DTO 변환 작업 실행 - 반환할 보고서 ID: " + entity.getId());
        
        return ReportBuildResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .templateId(entity.getTemplateId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .targetYear(entity.getTargetYear())
                .scope(entity.getScope())
                .version(entity.getVersion())
                .fileUrl(entity.getFileUrl())
                .isPublic(entity.getIsPublic())
                .generatedBy(entity.getGeneratedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}