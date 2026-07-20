package com.esg.platform.domain.metric.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MetricScoreValueDto {
    private String indicatorCode;
    private BigDecimal averageValue;
    private BigDecimal totalValue;
}
