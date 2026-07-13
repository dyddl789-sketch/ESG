package com.esg.platform.global.operation;

import java.time.OffsetDateTime;

public record OperationEvent(
        String type,
        String domain,
        String jobId,
        String status,
        int progress,
        String message,
        String result,
        OffsetDateTime occurredAt
) {
    public static OperationEvent of(
            String type,
            String domain,
            String jobId,
            String status,
            int progress,
            String message
    ) {
        return new OperationEvent(
                type,
                domain,
                jobId,
                status,
                progress,
                message,
                null,
                OffsetDateTime.now());
    }

    public static OperationEvent completedWithResult(
            String type,
            String domain,
            String jobId,
            String message,
            String result
    ) {
        return new OperationEvent(
                type,
                domain,
                jobId,
                "COMPLETED",
                100,
                message,
                result,
                OffsetDateTime.now());
    }
}
