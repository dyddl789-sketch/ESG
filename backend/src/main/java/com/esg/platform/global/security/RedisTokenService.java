package com.esg.platform.global.security;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisTokenService {

    private static final String REFRESH_PREFIX = "auth:refresh:";
    private static final String BLACKLIST_PREFIX = "auth:blacklist:";

    private final StringRedisTemplate redisTemplate;

    public void saveRefreshToken(Long userId, String tokenId, String rawToken, Duration ttl) {
        redisTemplate.opsForValue().set(
                refreshKey(userId, tokenId),
                TokenHashUtil.sha256(rawToken),
                ttl
        );
        log.debug("[REDIS_AUTH] Refresh Token 저장 userId={} jti={} ttl={}s",
                userId, tokenId, ttl.toSeconds());
    }

    public void verifyRefreshToken(Long userId, String tokenId, String rawToken) {
        String savedHash = redisTemplate.opsForValue().get(refreshKey(userId, tokenId));
        String presentedHash = TokenHashUtil.sha256(rawToken);
        if (savedHash == null || !TokenHashUtil.constantTimeEquals(savedHash, presentedHash)) {
            log.warn("[REDIS_AUTH] Refresh Token 검증 실패 userId={} jti={}", userId, tokenId);
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REUSED);
        }
        log.debug("[REDIS_AUTH] Refresh Token 검증 성공 userId={} jti={}", userId, tokenId);
    }

    public void deleteRefreshToken(Long userId, String tokenId) {
        redisTemplate.delete(refreshKey(userId, tokenId));
        log.debug("[REDIS_AUTH] Refresh Token 삭제 userId={} jti={}", userId, tokenId);
    }

    public void blacklistAccessToken(String tokenId, Duration ttl) {
        if (tokenId == null || ttl.isZero() || ttl.isNegative()) {
            return;
        }
        redisTemplate.opsForValue().set(BLACKLIST_PREFIX + tokenId, "logout", ttl);
        log.debug("[REDIS_AUTH] Access Token 블랙리스트 등록 jti={} ttl={}s",
                tokenId, ttl.toSeconds());
    }

    public boolean isBlacklisted(String tokenId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + tokenId));
    }

    private String refreshKey(Long userId, String tokenId) {
        return REFRESH_PREFIX + userId + ":" + tokenId;
    }
}
