package com.esg.platform.domain.report.entity;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedReport {
    private Long id;
    private Long templateId;
    private String title;       // 추가됨: 유저가 입력한 보고서 제목
    private String content;     // 추가됨: 에디터에서 작성한 HTML 본문
    private String version;
    private String fileUrl;
    private Boolean isPublic;
    private Long generatedBy;
    private LocalDateTime createdAt;
}