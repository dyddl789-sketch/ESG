// 기능 요약: 보고서 생성 요청(Request) 데이터를 유효성 검증과 함께 바인딩하는 DTO 클래스이며, 누락된 비즈니스 필드인 보고 연도와 범위를 추가합니다.
package com.esg.platform.domain.reportbuild.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ReportCreateRequest {
    // 템플릿 마스터 테이블과의 연계를 위한 식별 번호 필드
    @NotNull(message = "템플릿 ID는 필수입니다.")
    private Long templateId;

    // 리포트 빌더에서 작성자가 입력한 최종 보고서 제목 필드
    @NotBlank(message = "보고서 제목을 입력해주세요.")
    private String title;

    // 에디터(ReactQuill)를 통해 생성된 HTML 포맷의 보고서 본문 데이터 필드
    @NotBlank(message = "보고서 내용을 작성해주세요.")
    private String content;

    // 대상 지표 및 데이터의 기준 시점을 정의하는 정수형 연도 필드 (400 에러 방지 필수 항목)
    @NotNull(message = "보고 연도는 필수입니다.")
    private Integer targetYear;

    // 보고서의 공간적 또는 조직적 경계를 나타내는 범위 필드 (예: 전체 사업장, 울산공장)
    @NotBlank(message = "보고 범위를 입력해주세요.")
    private String scope;

    // 보고서의 개정 이력을 관리하기 위한 버전 문자열 필드
    @NotBlank(message = "버전 정보는 필수입니다. (예: v1.0)")
    private String version;

    // 파일 스토리지에 업로드된 최종 PDF 문서의 다운로드 경로 주소 필드
    @NotBlank(message = "파일 URL은 필수입니다.")
    private String fileUrl;

    // 일반 사용자에게 보고서를 공개할지 여부를 결정하는 플래그 필드 (기본값: 비공개)
    private Boolean isPublic = false;
}