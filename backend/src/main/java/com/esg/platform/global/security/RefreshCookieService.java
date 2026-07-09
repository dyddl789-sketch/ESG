package com.esg.platform.global.security;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.esg.platform.global.config.AppProperties;

import jakarta.servlet.http.HttpServletResponse;

@Component
public class RefreshCookieService {

    private final AppProperties properties;

    public RefreshCookieService(AppProperties properties) {
        this.properties = properties;
    }

    public String cookieName() {
        return properties.auth().refreshCookieName();
    }

    public void write(HttpServletResponse response, String refreshToken, Duration ttl) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(cookieName(), refreshToken)
                .httpOnly(true)
                .secure(properties.cookie().secure())
                .sameSite(properties.cookie().sameSite())
                .path("/api/auth")
                .maxAge(ttl);
        applyDomain(builder);
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void clear(HttpServletResponse response) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(cookieName(), "")
                .httpOnly(true)
                .secure(properties.cookie().secure())
                .sameSite(properties.cookie().sameSite())
                .path("/api/auth")
                .maxAge(Duration.ZERO);
        applyDomain(builder);
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    private void applyDomain(ResponseCookie.ResponseCookieBuilder builder) {
        String domain = properties.cookie().domain();
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }
    }
}
