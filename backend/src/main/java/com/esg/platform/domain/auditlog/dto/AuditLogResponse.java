package com.esg.platform.domain.auditlog.dto;

import lombok.Builder;

@Builder
public record AuditLogResponse(
    Long id,
    String at,         // performed_at 타임스탬프
    String reporter,   // 💡 [변경] 최초 실적 데이터 입력/보고자 실명 (input_user_id 기반)
    String approver,   // 💡 [변경] 최종 결재 승인 처리자 실명 (approver_user_id 기반)
    String action,     // '최종승인확정'
    String target,     // esg_indicators.title
    String detail      // 한글 상세 서술문
) {}
