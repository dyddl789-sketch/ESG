package com.esg.platform.global.operation;

import java.time.Duration;
import java.util.Collections;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisOperationService {

    private static final Duration COLLECTION_LOCK_TTL = Duration.ofMinutes(10);
    private static final Duration JOB_STATE_TTL = Duration.ofHours(24);
    private static final DefaultRedisScript<Long> RELEASE_LOCK_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then "
                    + "return redis.call('del', KEYS[1]) "
                    + "else return 0 end",
            Long.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public String acquireLock(String domain, String period) {
        String key = collectionLockKey(domain, period);
        String ownerToken = UUID.randomUUID().toString();
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, ownerToken, COLLECTION_LOCK_TTL);

        log.info(
                "[REDIS_COLLECTION] 수집 락 획득 domain={} period={} acquired={} ttlSeconds={}",
                domain,
                period,
                Boolean.TRUE.equals(acquired),
                COLLECTION_LOCK_TTL.toSeconds());
        return Boolean.TRUE.equals(acquired) ? ownerToken : null;
    }

    public void releaseLock(String domain, String period, String ownerToken) {
        if (ownerToken == null || ownerToken.isBlank()) {
            return;
        }

        String key = collectionLockKey(domain, period);
        Long released = redisTemplate.execute(
                RELEASE_LOCK_SCRIPT,
                Collections.singletonList(key),
                ownerToken);
        log.debug(
                "[REDIS_COLLECTION] 수집 락 해제 domain={} period={} released={}",
                domain,
                period,
                released != null && released > 0);
    }

    public void saveJob(OperationEvent event) {
        try {
            redisTemplate.opsForValue().set(
                    "job:esg:" + event.jobId(),
                    objectMapper.writeValueAsString(event),
                    JOB_STATE_TTL);
        } catch (Exception exception) {
            log.warn(
                    "[REDIS_JOB] 작업 상태 저장 실패 jobId={} type={} status={}",
                    event.jobId(),
                    event.type(),
                    event.status(),
                    exception);
        }
    }

    public void evictDashboardCache(String domain) {
        var keys = redisTemplate.keys("cache:dashboard:" + domain.toLowerCase() + ":*");
        if (keys == null || keys.isEmpty()) {
            return;
        }

        Long deleted = redisTemplate.delete(keys);
        log.debug("[REDIS_CACHE] 대시보드 캐시 삭제 domain={} deleted={}", domain, deleted);
    }

    private String collectionLockKey(String domain, String period) {
        return "lock:integration:" + domain.toUpperCase() + ":" + period;
    }
}
