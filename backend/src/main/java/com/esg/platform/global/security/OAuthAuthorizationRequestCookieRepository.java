package com.esg.platform.global.security;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.SerializationUtils;
import org.springframework.web.util.WebUtils;

import com.esg.platform.global.config.AppProperties;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuthAuthorizationRequestCookieRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private static final String COOKIE_NAME = "ESG_OAUTH2_REQUEST_ID";
    private static final String REDIS_PREFIX = "auth:oauth-request:";
    private static final Duration REQUEST_TTL = Duration.ofMinutes(3);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AppProperties properties;
    private final StringRedisTemplate redisTemplate;

    public OAuthAuthorizationRequestCookieRepository(
            AppProperties properties,
            StringRedisTemplate redisTemplate
    ) {
        this.properties = properties;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, COOKIE_NAME);
        if (cookie == null) {
            return null;
        }
        return deserialize(redisTemplate.opsForValue().get(REDIS_PREFIX + cookie.getValue()));
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (authorizationRequest == null) {
            deleteCookie(response);
            return;
        }

        String requestId = randomId();
        byte[] serialized = SerializationUtils.serialize(authorizationRequest);
        String encoded = Base64.getEncoder().encodeToString(serialized);
        redisTemplate.opsForValue().set(REDIS_PREFIX + requestId, encoded, REQUEST_TTL);
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(requestId, REQUEST_TTL).toString());
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        Cookie cookie = WebUtils.getCookie(request, COOKIE_NAME);
        deleteCookie(response);
        if (cookie == null) {
            return null;
        }
        String encoded = redisTemplate.opsForValue().getAndDelete(REDIS_PREFIX + cookie.getValue());
        return deserialize(encoded);
    }

    public void deleteCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", Duration.ZERO).toString());
    }

    private OAuth2AuthorizationRequest deserialize(String encoded) {
        if (encoded == null || encoded.isBlank()) {
            return null;
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(encoded);
            return (OAuth2AuthorizationRequest) SerializationUtils.deserialize(bytes);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String randomId() {
        byte[] bytes = new byte[24];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private ResponseCookie buildCookie(String value, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(properties.cookie().secure())
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge);
        if (properties.cookie().domain() != null && !properties.cookie().domain().isBlank()) {
            builder.domain(properties.cookie().domain());
        }
        return builder.build();
    }
}
