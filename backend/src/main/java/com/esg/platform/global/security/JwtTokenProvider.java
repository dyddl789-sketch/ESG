package com.esg.platform.global.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.esg.platform.domain.member.entity.User;
import com.esg.platform.global.config.AppProperties;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TOKEN_TYPE = "tokenType";
    private static final String CLAIM_TOKEN_VERSION = "tokenVersion";

    private final SecretKey secretKey;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public JwtTokenProvider(AppProperties properties) {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(properties.jwt().secret());
        } catch (RuntimeException exception) {
            throw new IllegalStateException("JWT_SECRET은 Base64 형식이어야 합니다.", exception);
        }
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET은 최소 256비트 이상이어야 합니다.");
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTtl = properties.jwt().accessTokenExpiration();
        this.refreshTtl = properties.jwt().refreshTokenExpiration();
    }

    public JwtTokenPair createTokenPair(User user) {
        return new JwtTokenPair(
                createToken(user, JwtTokenType.ACCESS, accessTtl),
                createToken(user, JwtTokenType.REFRESH, refreshTtl),
                accessTtl,
                refreshTtl
        );
    }

    public String createAccessToken(User user) {
        return createToken(user, JwtTokenType.ACCESS, accessTtl);
    }

    public String createRefreshToken(User user) {
        return createToken(user, JwtTokenType.REFRESH, refreshTtl);
    }

    private String createToken(User user, JwtTokenType type, Duration ttl) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(ttl);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_TOKEN_TYPE, type.name())
                .claim(CLAIM_TOKEN_VERSION, user.getTokenVersion())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
    }

    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
    }

    public Claims parseExpected(String token, JwtTokenType expectedType) {
        Claims claims = parse(token);
        String actualType = claims.get(CLAIM_TOKEN_TYPE, String.class);
        if (!expectedType.name().equals(actualType)) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
        return claims;
    }

    public Long getUserId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public int getTokenVersion(Claims claims) {
        Number value = claims.get(CLAIM_TOKEN_VERSION, Number.class);
        return value == null ? 0 : value.intValue();
    }

    public String getJti(Claims claims) {
        return claims.getId();
    }

    public Duration getRemainingTtl(Claims claims) {
        long millis = Math.max(0, claims.getExpiration().getTime() - System.currentTimeMillis());
        return Duration.ofMillis(millis);
    }

    public Duration getAccessTtl() {
        return accessTtl;
    }

    public Duration getRefreshTtl() {
        return refreshTtl;
    }
}
