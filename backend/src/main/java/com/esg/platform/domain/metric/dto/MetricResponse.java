package com.esg.platform.domain.metric.dto;

import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.entity.EsgCategory;
import java.math.BigDecimal;
import java.util.List;

public record MetricResponse(
    Long id,
    EsgCategory category,
    String subCategory,
    String indicatorCode,
    String title,
    String facility,
    Integer year,
    String period,
    BigDecimal value,
    String unit,
    String source,
    String method,
    DataStatus status,
    String evidence,
    String risk,
    String aiFinding,
    String assignee,
    List<BigDecimal> months, // 차트용 최근 5개월 데이터
    List<MetricHistoryResponse> history // 이력 정보
) {}
