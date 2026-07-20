package com.esg.platform.domain.dashboard.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DashboardKpiDto {
    private String category;
    private String indicatorCode;
    private String title;
    private String unit;
    private BigDecimal value;
    private BigDecimal previousValue;
    private BigDecimal changeRate;
}
