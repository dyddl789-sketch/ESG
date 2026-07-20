package com.esg.platform.domain.performance.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class PerformanceResponse {
    private String indicatorCode;
    private String title;
    private String category;
    private String period;      // 최신 기준 월 (예: 2026-05)
    private String source;
    private BigDecimal value;   // 최신 실적 수치
    private String unit;
    private String status;
    private List<BigDecimal> months; // 1~12월 배열 (프론트엔드 차트용)
}