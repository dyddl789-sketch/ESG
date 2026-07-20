package com.esg.platform.domain.reportbuild.entity;

import lombok.*;
import java.time.OffsetDateTime;

@Getter @Builder
@NoArgsConstructor @AllArgsConstructor
public class GeneratedReport {
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
}