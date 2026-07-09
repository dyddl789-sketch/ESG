package com.esg.platform.domain.auth.oauth;

import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.esg.platform.global.config.AppProperties;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuthLoginCodeService {

    private static final String PREFIX = "auth:oauth-code:";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final AppProperties properties;

    public String create(Long userId) {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        redisTemplate.opsForValue().set(
                PREFIX + code,
                String.valueOf(userId),
                properties.auth().oauthCodeExpiration()
        );
        return code;
    }

    public Long consume(String code) {
        String userId = redisTemplate.opsForValue().getAndDelete(PREFIX + code);
        if (userId == null) {
            throw new BusinessException(ErrorCode.OAUTH_LOGIN_FAILED);
        }
        return Long.valueOf(userId);
    }
}
