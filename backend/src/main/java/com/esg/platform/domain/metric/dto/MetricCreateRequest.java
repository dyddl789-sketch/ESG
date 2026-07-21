package com.esg.platform.domain.metric.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * [신규] ESG 데이터 신규 등록 요청 DTO
 * - 프론트엔드 신규 데이터 등록 폼(MetricFormPage)에서 전송하는 필드
 * - companyId / inputUserId는 인증 정보(EsgUserPrincipal)에서 추출하므로 받지 않는다
 */
public record MetricCreateRequest(
    Integer indicatorId,      // 필수: esg_indicators.id
    Integer facilityId,       // 선택: 사업장 (null이면 '전체')
    Integer reportingYear,    // 필수: 보고 연도
    String periodType,        // MONTHLY | QUARTERLY | HALFYEARLY | YEARLY (기본 MONTHLY)
    Integer periodValue,      // 필수: 월(1~12) 또는 분기(1~4) 등
    BigDecimal value,         // 정량 수치 (numerical_value)
    BigDecimal shipmentAmount, // 환경 전력 데이터의 출하액(백만원)
    String textValue,                // 정성 텍스트
    String evidenceFileUrl,          // 증빙 파일 URL
    String evidenceOriginalFilename, // 실제 업로드 원본 파일명
    String evidenceContentType,      // 실제 업로드 MIME 타입
    Long evidenceFileSize,           // 실제 업로드 파일 크기(byte)
    OffsetDateTime evidenceUploadedAt, // 실제 업로드 시각
    Boolean submitForApproval        // true면 등록 즉시 PENDING(승인 요청), false/null이면 DRAFT
) {}
