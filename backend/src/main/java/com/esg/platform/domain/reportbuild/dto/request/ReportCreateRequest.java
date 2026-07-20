package com.esg.platform.domain.reportbuild.dto.request;

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

    @NotNull(message = "보고 연도는 필수입니다.")
    private Integer targetYear;

    @NotBlank(message = "보고 범위를 입력해주세요.")
    private String scope;

    @NotBlank(message = "버전 정보는 필수입니다. (예: v1.0)")
    private String version;

    // PDF가 실제로 생성되기 전의 편집본도 저장할 수 있도록 선택값으로 둔다.
    // DB의 NOT NULL 제약을 위해 서비스에서 null을 빈 문자열로 정규화한다.
    private String fileUrl;

    private Boolean isPublic = false;
}
