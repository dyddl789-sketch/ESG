package com.esg.platform.domain.metric.dto;

public record MetricBatchResult(
        String period,
        String category,
        int processedCount,
        String status,
        String message
) {
}
