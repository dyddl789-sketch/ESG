package com.esg.platform.domain.metric.dto;

public record MetricHistoryResponse(
    String at,      // 일시
    String user,    // 작업자
    String action,  // 작업 내용 (승인, 반려 등)
    String comment  // 의견
) {}
