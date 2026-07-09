package com.esg.platform.global.security;

import java.time.Duration;
import java.util.Locale;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.esg.platform.global.config.AppProperties;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private static final String FAILURE_PREFIX = "auth:login:failure:";
    private static final String LOCK_PREFIX = "auth:login:lock:";

    private final StringRedisTemplate redisTemplate;
    private final AppProperties properties;

    public void assertNotBlocked(String email, String clientIp) {
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey(email, clientIp)))) {
            throw new BusinessException(ErrorCode.LOGIN_TEMPORARILY_BLOCKED);
        }
    }

    public void recordFailure(String email, String clientIp) {
        String failureKey = failureKey(email, clientIp);
        Long count = redisTemplate.opsForValue().increment(failureKey);
        if (count != null && count == 1L) {
            redisTemplate.expire(failureKey, properties.auth().loginFailureWindow());
        }

        if (count != null && count >= properties.auth().loginMaxFailures()) {
            redisTemplate.opsForValue().set(
                    lockKey(email, clientIp),
                    "locked",
                    properties.auth().loginLockDuration()
            );
            redisTemplate.delete(failureKey);
        }
    }

    public void clear(String email, String clientIp) {
        redisTemplate.delete(failureKey(email, clientIp));
        redisTemplate.delete(lockKey(email, clientIp));
    }

    private String failureKey(String email, String clientIp) {
        return FAILURE_PREFIX + normalized(email) + ":" + normalizedIp(clientIp);
    }

    private String lockKey(String email, String clientIp) {
        return LOCK_PREFIX + normalized(email) + ":" + normalizedIp(clientIp);
    }

    private String normalized(String email) {
        return TokenHashUtil.sha256(email.trim().toLowerCase(Locale.ROOT));
    }

    private String normalizedIp(String clientIp) {
        String value = clientIp == null || clientIp.isBlank() ? "unknown" : clientIp;
        return TokenHashUtil.sha256(value);
    }
}
