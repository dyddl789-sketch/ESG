package com.esg.platform.domain.benchmark.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class ExternalBenchmarkValue {
    private Long id;
    private Integer companyId;
    private String sourceCode;
    private String datasetCode;
    private String metricCode;
    private Integer baseYear;
    private String industryCode;
    private String industryName;
    private BigDecimal originalValue;
    private String originalUnit;
    private BigDecimal normalizedValue;
    private String normalizedUnit;
    private String sourceUpdatedAt;
    private String rawPayload;
    private OffsetDateTime syncedAt;
    private Long syncRunId;
}
