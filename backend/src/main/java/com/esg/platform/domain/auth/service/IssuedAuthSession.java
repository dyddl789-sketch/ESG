package com.esg.platform.domain.auth.service;

import java.time.Duration;

import com.esg.platform.domain.auth.dto.AuthSessionResponse;

public record IssuedAuthSession(
        AuthSessionResponse response,
        String refreshToken,
        Duration refreshTokenTtl
) {
}
