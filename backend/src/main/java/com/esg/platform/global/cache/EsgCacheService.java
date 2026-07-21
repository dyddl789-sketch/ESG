package com.esg.platform.global.cache;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EsgCacheService {

    private static final Logger log = LoggerFactory.getLogger(EsgCacheService.class);
    private static final String PREFIX = "cache:esg:company:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public EsgCacheService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public String key(Long companyId, String area, Object... segments) {
        StringBuilder builder = new StringBuilder(PREFIX)
                .append(companyId == null ? 1L : companyId)
                .append(':')
                .append(area);

        for (Object segment : segments) {
            String value = segment == null ? "" : String.valueOf(segment).trim();
            builder.append(':').append(value.isEmpty() ? "all" : value);
        }
        return builder.toString();
    }

    public <T> T getOrLoad(String key, Class<T> type, Duration ttl, Supplier<T> loader) {
        try {
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.debug("[REDIS_CACHE] hit key={}", key);
                return objectMapper.readValue(cached, type);
            }
        } catch (Exception exception) {
            log.warn("[REDIS_CACHE] 조회 실패 key={} reason={}", key, exception.getClass().getSimpleName());
        }

        T value = loader.get();
        store(key, value, ttl);
        return value;
    }

    public <T> List<T> getOrLoadList(
            String key,
            Class<T> elementType,
            Duration ttl,
            Supplier<List<T>> loader) {
        try {
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                JavaType listType = objectMapper.getTypeFactory()
                        .constructCollectionType(List.class, elementType);
                log.debug("[REDIS_CACHE] hit key={}", key);
                return objectMapper.readValue(cached, listType);
            }
        } catch (Exception exception) {
            log.warn("[REDIS_CACHE] 목록 조회 실패 key={} reason={}", key, exception.getClass().getSimpleName());
        }

        List<T> value = loader.get();
        store(key, value, ttl);
        return value;
    }

    public void evictCompanyAfterCommit(Long companyId) {
        Runnable eviction = () -> evictCompany(companyId);

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eviction.run();
                }
            });
            return;
        }

        eviction.run();
    }

    public void evictCompany(Long companyId) {
        String pattern = PREFIX + (companyId == null ? 1L : companyId) + ":*";

        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys == null || keys.isEmpty()) {
                return;
            }

            Long deleted = redisTemplate.delete(keys);
            log.info("[REDIS_CACHE] 기업 ESG 조회 캐시 삭제 companyId={} deleted={}", companyId, deleted);
        } catch (Exception exception) {
            log.warn("[REDIS_CACHE] 기업 캐시 삭제 실패 companyId={} reason={}",
                    companyId, exception.getClass().getSimpleName());
        }
    }

    private void store(String key, Object value, Duration ttl) {
        if (value == null) {
            return;
        }

        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value), ttl);
            log.debug("[REDIS_CACHE] 저장 key={} ttlSeconds={}", key, ttl.toSeconds());
        } catch (Exception exception) {
            log.warn("[REDIS_CACHE] 저장 실패 key={} reason={}", key, exception.getClass().getSimpleName());
        }
    }
}
