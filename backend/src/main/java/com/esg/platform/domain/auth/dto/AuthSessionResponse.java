package com.esg.platform.domain.auth.dto;

import com.esg.platform.domain.member.dto.UserResponse;

public record AuthSessionResponse(
        String accessToken,
        long expiresInSeconds,
        UserResponse user
) {
}
