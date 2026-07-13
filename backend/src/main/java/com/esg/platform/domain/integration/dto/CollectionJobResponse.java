package com.esg.platform.domain.integration.dto;

public record CollectionJobResponse(
        String jobId,
        String domain,
        String basePeriod,
        String status
) {
}
