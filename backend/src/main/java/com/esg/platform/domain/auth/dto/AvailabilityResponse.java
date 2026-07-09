package com.esg.platform.domain.auth.dto;

public record AvailabilityResponse(
        boolean available,
        String message
) {
}
