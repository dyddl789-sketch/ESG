package com.esg.platform.domain.integration.dto;

import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class CollectionRunDto {
    private Long id;
    private Long companyId;
    private String domain;
    private String sourceSystem;
    private String basePeriod;
    private String triggerType;
    private String status;
    private Integer totalCount;
    private Integer successCount;
    private Integer errorCount;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private String errorMessage;
}
