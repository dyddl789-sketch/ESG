package com.esg.platform.domain.dashboard.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class DashboardScoreDto {
    private String period;
    private BigDecimal totalScore;
    private BigDecimal eScore;
    private BigDecimal sScore;
    private BigDecimal gScore;
    private String grade;
    private OffsetDateTime calculatedAt;
}
