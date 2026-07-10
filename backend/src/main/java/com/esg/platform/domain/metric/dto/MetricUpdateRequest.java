package com.esg.platform.domain.metric.dto;

import java.math.BigDecimal;

public record MetricUpdateRequest(
    BigDecimal value,
    String textValue,
    String evidenceFileUrl,
    String comment // 수정 또는 반려 사유
) {}
