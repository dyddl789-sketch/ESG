package com.esg.platform.global.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendUrl,
        Cors cors,
        Cookie cookie,
        Jwt jwt,
        Auth auth
) {
    public record Cors(List<String> allowedOrigins) {
    }

    public record Cookie(boolean secure, String sameSite, String domain) {
    }

    public record Jwt(String secret, Duration accessTokenExpiration, Duration refreshTokenExpiration) {
    }

    public record Auth(
            String refreshCookieName,
            int loginMaxFailures,
            Duration loginFailureWindow,
            Duration loginLockDuration,
            Duration oauthCodeExpiration
    ) {
    }
}
