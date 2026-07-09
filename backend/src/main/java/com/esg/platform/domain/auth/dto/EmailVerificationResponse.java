package com.esg.platform.domain.auth.dto;

public record EmailVerificationResponse(
        String email,
        boolean verified,
        long expiresInSeconds,
        String message
) {
}
