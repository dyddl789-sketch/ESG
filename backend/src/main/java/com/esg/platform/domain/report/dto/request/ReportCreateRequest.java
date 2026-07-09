package com.esg.platform.domain.report.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ReportCreateRequest {
    @NotNull(message = "템플릿 ID는 필수입니다.")
    private Long templateId;

    @NotBlank(message = "보고서 제목을 입력해주세요.")
    private String title;

    @NotBlank(message = "보고서 내용을 작성해주세요.")
    private String content;

    @NotBlank(message = "버전 정보는 필수입니다. (예: v1.0)")
    private String version;

    @NotBlank(message = "파일 URL은 필수입니다.")
    private String fileUrl;

    private Boolean isPublic = false;
}