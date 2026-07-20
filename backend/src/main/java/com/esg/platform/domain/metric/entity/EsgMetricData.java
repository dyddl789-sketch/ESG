package com.esg.platform.domain.metric.entity;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EsgMetricData {
    private Long id;
    private Integer companyId;
    private Integer facilityId;
    private Integer indicatorId;
    private Integer reportingYear;
    private PeriodType periodType;
    private Integer periodValue;
    private BigDecimal activityValue;
    private BigDecimal energyCost;
    private BigDecimal toeValue;
    private BigDecimal peakDemandKw;
    private Integer emissionFactorId;
    private BigDecimal numericalValue;
    private BigDecimal shipmentAmountMillionKrw;
    private String textValue;
    private String evidenceFileUrl;
    private DataStatus status;
    private String dataSourceType;
    private Integer inputUserId;
    private Integer approverUserId;
    private String rejectReason;
    private String hashSignature;
    private String additionalInfo; // JSONB 데이터는 String 또는 Map으로 처리 가능
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
