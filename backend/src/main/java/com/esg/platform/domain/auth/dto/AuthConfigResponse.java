package com.esg.platform.domain.auth.dto;

public record AuthConfigResponse(
        boolean kakaoLoginEnabled,
        String kakaoAuthorizationPath
) {
}
