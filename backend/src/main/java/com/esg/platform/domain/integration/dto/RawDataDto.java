package com.esg.platform.domain.integration.dto;

import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class RawDataDto {
    private Long id;
    private Long runId;
    private Long companyId;
    private Long facilityId;
    private String facilityName;
    private String domain;
    private String sourceSystem;
    private String sourceRecordId;
    private String basePeriod;
    private String payload;
    private String validationStatus;
    private String errorMessage;
    private OffsetDateTime collectedAt;
}
