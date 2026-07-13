package com.esg.platform.domain.metric.dto;

import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class MetricHistoryDto {
    private Long id;
    private String actionType;
    private String fromStatus;
    private String toStatus;
    private String comment;
    private String actorName;
    private OffsetDateTime actedAt;
}
