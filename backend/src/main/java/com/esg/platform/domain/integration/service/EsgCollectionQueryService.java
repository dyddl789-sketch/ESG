package com.esg.platform.domain.integration.service;

import java.time.YearMonth;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.company.dto.FacilityDto;
import com.esg.platform.domain.company.service.CompanyService;
import com.esg.platform.domain.integration.dto.CollectionRunDto;
import com.esg.platform.domain.integration.dto.EnvironmentMonthlyDto;
import com.esg.platform.domain.integration.dto.FacilityEsgDetailDto;
import com.esg.platform.domain.integration.dto.GovernancePeriodDto;
import com.esg.platform.domain.integration.dto.RawDataDto;
import com.esg.platform.domain.integration.dto.SocialMonthlyDto;
import com.esg.platform.domain.integration.mapper.EsgCollectionMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EsgCollectionQueryService {

    private static final Long COMPANY_ID = 1L;
    private static final int DEFAULT_LIMIT = 100;

    private final EsgCollectionMapper collectionMapper;
    private final CompanyService companyService;

    public List<EnvironmentMonthlyDto> getEnvironment(
            String period,
            Long facilityId,
            String search,
            String reflectionStatus,
            String approvalStatus,
            boolean approvedOnly) {
        return collectionMapper.findEnvironmentMonthly(
                COMPANY_ID,
                normalizeOptionalMonth(period),
                facilityId,
                trimToNull(search),
                normalizeStatus(reflectionStatus),
                normalizeStatus(approvalStatus),
                approvedOnly);
    }

    public List<SocialMonthlyDto> getSocial(
            String period,
            Long facilityId,
            String search,
            String reflectionStatus,
            String approvalStatus,
            boolean approvedOnly) {
        return collectionMapper.findSocialMonthly(
                COMPANY_ID,
                normalizeOptionalMonth(period),
                facilityId,
                trimToNull(search),
                normalizeStatus(reflectionStatus),
                normalizeStatus(approvalStatus),
                approvedOnly);
    }

    public List<GovernancePeriodDto> getGovernance(
            String period,
            String reflectionStatus,
            String approvalStatus,
            boolean approvedOnly) {
        return collectionMapper.findGovernancePeriods(
                COMPANY_ID,
                normalizeOptionalMonth(period),
                normalizeStatus(reflectionStatus),
                normalizeStatus(approvalStatus),
                approvedOnly);
    }

    public FacilityEsgDetailDto getFacilityDetail(Long facilityId, String period, boolean approvedOnly) {
        String basePeriod = normalizeMonthOrPrevious(period);
        FacilityDto facility = companyService.getFacility(facilityId);
        int year = YearMonth.parse(basePeriod).getYear();

        EnvironmentMonthlyDto environment = collectionMapper.findEnvironmentByFacility(COMPANY_ID, facilityId, basePeriod);
        SocialMonthlyDto social = collectionMapper.findSocialByFacility(COMPANY_ID, facilityId, basePeriod);
        GovernancePeriodDto governance = collectionMapper.findGovernancePeriod(COMPANY_ID, basePeriod);

        if (approvedOnly) {
            if (environment != null && !"APPROVED".equals(environment.getApprovalStatus())) {
                environment = null;
            }
            if (social != null && !"APPROVED".equals(social.getApprovalStatus())) {
                social = null;
            }
            if (governance != null && !"APPROVED".equals(governance.getApprovalStatus())) {
                governance = null;
            }
        }

        List<EnvironmentMonthlyDto> environmentHistory = collectionMapper.findEnvironmentHistory(COMPANY_ID, facilityId, year);
        List<SocialMonthlyDto> socialHistory = collectionMapper.findSocialHistory(COMPANY_ID, facilityId, year);
        if (approvedOnly) {
            environmentHistory = environmentHistory.stream().filter(row -> "APPROVED".equals(row.getApprovalStatus())).toList();
            socialHistory = socialHistory.stream().filter(row -> "APPROVED".equals(row.getApprovalStatus())).toList();
        }

        FacilityEsgDetailDto detail = new FacilityEsgDetailDto(
                facility,
                basePeriod,
                environment,
                social,
                governance,
                environmentHistory,
                socialHistory,
                approvedOnly ? List.of() : collectionMapper.findRawData(COMPANY_ID, facilityId, null, null, DEFAULT_LIMIT),
                approvedOnly ? List.of() : collectionMapper.findRuns(COMPANY_ID, null, null, 30));

        log.debug("[ESG_QUERY] 사업장 상세 조회 facilityId={} period={} approvedOnly={} envMonths={} socialMonths={}",
                facilityId, basePeriod, approvedOnly, environmentHistory.size(), socialHistory.size());
        return detail;
    }

    public List<RawDataDto> getRawData(Long facilityId, String domain, String period, Integer limit) {
        return collectionMapper.findRawData(
                COMPANY_ID,
                facilityId,
                normalizeDomain(domain),
                normalizeOptionalMonth(period),
                normalizeLimit(limit));
    }

    public List<CollectionRunDto> getRuns(String domain, String period, Integer limit) {
        return collectionMapper.findRuns(
                COMPANY_ID,
                normalizeDomain(domain),
                normalizeOptionalMonth(period),
                normalizeLimit(limit));
    }

    private String normalizeMonthOrPrevious(String period) {
        if (period == null || period.isBlank()) {
            return YearMonth.now().minusMonths(1).toString();
        }
        return parseMonth(period);
    }

    private String normalizeOptionalMonth(String period) {
        return period == null || period.isBlank() ? null : parseMonth(period);
    }

    private String parseMonth(String period) {
        try {
            return YearMonth.parse(period.trim()).toString();
        } catch (RuntimeException exception) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "기준월은 YYYY-MM 형식이어야 합니다.");
        }
    }

    private String normalizeDomain(String domain) {
        if (domain == null || domain.isBlank()) {
            return null;
        }
        String normalized = domain.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ENVIRONMENT", "SOCIAL", "GOVERNANCE").contains(normalized)) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_ESG_DOMAIN);
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        return status == null || status.isBlank() ? null : status.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private int normalizeLimit(Integer limit) {
        return limit == null ? DEFAULT_LIMIT : Math.max(1, Math.min(limit, 500));
    }
}
