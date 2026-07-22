package com.esg.platform.domain.integration.service;

import java.time.YearMonth;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.integration.dto.ReflectionResponse;
import com.esg.platform.domain.integration.mapper.EsgCollectionMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsgReflectionService {

    private static final Long COMPANY_ID = 1L;

    private final EsgCollectionMapper collectionMapper;

    @Transactional
    public ReflectionResponse reflect(String rawDomain, String rawPeriod, Long facilityId, Long userId) {
        String domain = normalizeDomain(rawDomain);
        String period = normalizePeriod(rawPeriod);
        int reflectable = countReflectable(domain, period, facilityId);
        if (reflectable == 0) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "해당 월에 ESG 반영 가능한 수집 완료 데이터가 없습니다.");
        }

        int reflectedMetricCount;
        switch (domain) {
            case "ENVIRONMENT" -> {
                reflectedMetricCount = collectionMapper.reflectEnvironmentMetrics(COMPANY_ID, period, facilityId, userId);
                collectionMapper.markEnvironmentReflected(COMPANY_ID, period, facilityId);
            }
            case "SOCIAL" -> {
                reflectedMetricCount = collectionMapper.reflectSocialMetrics(COMPANY_ID, period, facilityId, userId);
                collectionMapper.markSocialReflected(COMPANY_ID, period, facilityId);
            }
            case "GOVERNANCE" -> {
                reflectedMetricCount = collectionMapper.reflectGovernanceMetrics(COMPANY_ID, period, userId);
                collectionMapper.markGovernanceReflected(COMPANY_ID, period);
            }
            default -> throw new BusinessException(ErrorCode.UNSUPPORTED_ESG_DOMAIN);
        }

        collectionMapper.insertReflectionHistory(COMPANY_ID, period, domain, facilityId, userId);

        log.info("[ESG_REFLECTION] ESG 반영 완료 companyId={} domain={} period={} facilityId={} userId={} metricCount={}",
                COMPANY_ID, domain, period, facilityId, userId, reflectedMetricCount);
        return new ReflectionResponse(domain, period, facilityId, reflectedMetricCount, "REFLECTED", "DRAFT");
    }

    private int countReflectable(String domain, String period, Long facilityId) {
        return switch (domain) {
            case "ENVIRONMENT" -> collectionMapper.countEnvironmentReflectable(COMPANY_ID, period, facilityId);
            case "SOCIAL" -> collectionMapper.countSocialReflectable(COMPANY_ID, period, facilityId);
            case "GOVERNANCE" -> collectionMapper.countGovernanceReflectable(COMPANY_ID, period);
            default -> 0;
        };
    }

    private String normalizeDomain(String value) {
        String domain = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!domain.equals("ENVIRONMENT") && !domain.equals("SOCIAL") && !domain.equals("GOVERNANCE")) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_ESG_DOMAIN);
        }
        return domain;
    }

    private String normalizePeriod(String value) {
        try {
            return YearMonth.parse(value).toString();
        } catch (RuntimeException exception) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "기준월은 YYYY-MM 형식이어야 합니다.");
        }
    }
}
