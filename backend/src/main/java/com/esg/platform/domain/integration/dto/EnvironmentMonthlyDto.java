package com.esg.platform.domain.integration.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class EnvironmentMonthlyDto {
    private Long id;
    private Long companyId;
    private Long facilityId;
    private String facilityName;
    private String facilityType;
    private String basePeriod;
    private BigDecimal electricityUsageKwh;
    private BigDecimal productionTon;
    private BigDecimal intensityKwhPerTon;
    private BigDecimal emissionFactor;
    private BigDecimal scope2Tco2eq;
    private String validationStatus;
    private String collectionStatus;
    private String reflectionStatus;
    private String approvalStatus;
    private OffsetDateTime collectedAt;
    private OffsetDateTime reflectedAt;
    private OffsetDateTime approvedAt;
}
