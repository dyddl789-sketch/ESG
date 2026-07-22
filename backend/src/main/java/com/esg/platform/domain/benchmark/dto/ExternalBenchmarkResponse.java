package com.esg.platform.domain.benchmark.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExternalBenchmarkResponse {
    private String status;
    private OffsetDateTime lastSyncedAt;
    private String lastErrorMessage;

    private Integer externalBaseYear;
    private String industryCode;
    private String industryName;
    private String externalPeriodLabel;
    private String sourceLabel;
    private String sourceUpdatedAt;

    private Integer internalBaseYear;
    private Integer internalThroughMonth;
    private String internalPeriodLabel;
    private boolean provisional;

    private BigDecimal internalElectricityMwh;
    private BigDecimal internalShipmentHundredMillionKrw;
    private BigDecimal internalScope2Tco2eq;

    private BigDecimal internalElectricityIntensity;
    private BigDecimal externalElectricityIntensity;
    private BigDecimal electricityImprovementPercent;

    private BigDecimal internalCarbonIntensity;
    private BigDecimal externalCarbonIntensity;
    private BigDecimal carbonImprovementPercent;

    private String electricityUnit;
    private String carbonUnit;
    private String methodologyNote;
}
