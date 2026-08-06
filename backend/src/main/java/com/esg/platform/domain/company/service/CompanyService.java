package com.esg.platform.domain.company.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.company.dto.CompanyDto;
import com.esg.platform.domain.company.dto.FacilityDto;
import com.esg.platform.domain.company.mapper.CompanyMapper;
import com.esg.platform.domain.company.mapper.FacilityMapper;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.domain.metric.service.EsgScoreCalculationService;
import com.esg.platform.global.cache.EsgCacheService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private static final Long COMPANY_ID = 1L;

    private final CompanyMapper companyMapper;
    private final FacilityMapper facilityMapper;
    private final MetricMapper metricMapper;
    private final EsgScoreCalculationService scoreCalculationService;
    private final EsgCacheService cacheService;

    @Transactional(readOnly = true)
    public CompanyDto getCompany() {
        return companyMapper.findById(COMPANY_ID);
    }

    @Transactional
    public CompanyDto updateCompany(CompanyDto dto) {
        dto.setId(COMPANY_ID);
        companyMapper.update(dto);
        cacheService.evictCompanyAfterCommit(COMPANY_ID);
        log.info("[COMPANY] 기업 기본정보 수정 companyId={}", COMPANY_ID);
        return companyMapper.findById(COMPANY_ID);
    }

    @Transactional(readOnly = true)
    public List<FacilityDto> getFacilities() {
        return facilityMapper.findAllByCompanyId(COMPANY_ID);
    }

    @Transactional(readOnly = true)
    public FacilityDto getFacility(Long id) {
        FacilityDto facility = facilityMapper.findByIdAndCompanyId(id, COMPANY_ID);
        if (facility == null) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_FOUND);
        }
        return facility;
    }

    @Transactional
    public FacilityDto createFacility(FacilityDto dto) {
        normalizeNewFacilityOperationPeriod(dto);
        validateOperationPeriod(dto);
        facilityMapper.insert(COMPANY_ID, dto);
        refreshScoresFrom(dto.getOperationStartDate(), "CREATE");
        cacheService.evictCompanyAfterCommit(COMPANY_ID);
        log.info(
                "[FACILITY] 사업장 등록 companyId={} facilityId={} facilityName={} type={} operationStart={} operationEnd={} hasCoordinates={}",
                COMPANY_ID,
                dto.getId(),
                dto.getFacilityName(),
                dto.getFacilityType(),
                dto.getOperationStartDate(),
                dto.getOperationEndDate(),
                dto.getLatitude() != null && dto.getLongitude() != null);
        return getFacility(dto.getId());
    }

    @Transactional
    public FacilityDto updateFacility(Long id, FacilityDto dto) {
        FacilityDto current = getFacility(id);
        dto.setId(id);
        if (dto.getOperationStartDate() == null) {
            dto.setOperationStartDate(current.getOperationStartDate());
        }
        if (Boolean.FALSE.equals(dto.getActive()) && dto.getOperationEndDate() == null) {
            dto.setOperationEndDate(LocalDate.now());
        }
        if (Boolean.TRUE.equals(dto.getActive()) && dto.getOperationEndDate() != null
                && dto.getOperationEndDate().isBefore(LocalDate.now())) {
            dto.setOperationEndDate(null);
        }
        validateOperationPeriod(dto);

        int updated = facilityMapper.update(COMPANY_ID, dto);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_FOUND);
        }
        refreshScoresFrom(earlierOf(current.getOperationStartDate(), dto.getOperationStartDate()), "UPDATE");
        cacheService.evictCompanyAfterCommit(COMPANY_ID);
        log.info(
                "[FACILITY] 사업장 수정 companyId={} facilityId={} facilityName={} operationStart={} operationEnd={} hasCoordinates={}",
                COMPANY_ID,
                id,
                dto.getFacilityName(),
                dto.getOperationStartDate(),
                dto.getOperationEndDate(),
                dto.getLatitude() != null && dto.getLongitude() != null);
        return getFacility(id);
    }

    @Transactional
    public void deleteFacility(Long id) {
        FacilityDto current = getFacility(id);
        int deleted = facilityMapper.delete(id, COMPANY_ID);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_FOUND);
        }
        refreshScoresFrom(current.getOperationStartDate(), "DELETE");
        cacheService.evictCompanyAfterCommit(COMPANY_ID);
        log.info("[FACILITY] 사업장 삭제 companyId={} facilityId={}", COMPANY_ID, id);
    }

    private void refreshScoresFrom(LocalDate startDate, String reason) {
        if (startDate == null) {
            return;
        }

        YearMonth threshold = YearMonth.from(startDate);
        List<String> periods = metricMapper.findAvailablePeriods(
                COMPANY_ID,
                null,
                null,
                null,
                true,
                false,
                false);
        int refreshed = 0;
        for (String period : periods) {
            YearMonth candidate = YearMonth.parse(period);
            if (candidate.isBefore(threshold)) {
                continue;
            }
            scoreCalculationService.refreshScore(COMPANY_ID, period);
            refreshed++;
        }
        log.info("[FACILITY_SCORE] 사업장 변경 후 기간별 점수·완성상태 재계산 companyId={} reason={} startPeriod={} refreshed={}",
                COMPANY_ID, reason, threshold, refreshed);
    }

    private LocalDate earlierOf(LocalDate left, LocalDate right) {
        if (left == null) return right;
        if (right == null) return left;
        return left.isBefore(right) ? left : right;
    }

    private void normalizeNewFacilityOperationPeriod(FacilityDto dto) {
        if (dto.getOperationStartDate() == null) {
            dto.setOperationStartDate(LocalDate.now());
        }
        if (dto.getActive() == null) {
            dto.setActive(Boolean.TRUE);
        }
        if (Boolean.FALSE.equals(dto.getActive()) && dto.getOperationEndDate() == null) {
            dto.setOperationEndDate(LocalDate.now());
        }
    }

    private void validateOperationPeriod(FacilityDto dto) {
        if (dto.getOperationStartDate() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "사업장 운영 시작일을 입력해 주세요.");
        }
        if (dto.getOperationEndDate() != null
                && dto.getOperationEndDate().isBefore(dto.getOperationStartDate())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "사업장 운영 종료일은 운영 시작일보다 빠를 수 없습니다.");
        }
    }
}
