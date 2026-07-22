package com.esg.platform.domain.benchmark.dto;

import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class ExternalBenchmarkSyncRun {
    private Long id;
    private Integer companyId;
    private Integer baseYear;
    private String industryCode;
    private String status;
    private Integer triggeredBy;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;
    private String errorMessage;
}
