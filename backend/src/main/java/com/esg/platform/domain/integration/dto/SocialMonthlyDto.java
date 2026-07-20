package com.esg.platform.domain.integration.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class SocialMonthlyDto {
    private Long id;
    private Long companyId;
    private Long facilityId;
    private String facilityName;
    private String facilityType;
    private String basePeriod;
    private Integer averageEmployees;
    private Integer exitCount;
    private Integer injuredEmployeeCount;
    private BigDecimal totalWorkHours;
    private Integer trainingTargetCount;
    private Integer trainingCompletedCount;
    private Integer hazardTotalCount;
    private Integer hazardCompletedCount;
    private BigDecimal injuryRate;
    private BigDecimal trainingCompletionRate;
    private BigDecimal hazardActionRate;
    private BigDecimal turnoverRate;
    private String validationStatus;
    private String collectionStatus;
    private String reflectionStatus;
    private String approvalStatus;
    private OffsetDateTime collectedAt;
    private OffsetDateTime reflectedAt;
    private OffsetDateTime approvedAt;
}
