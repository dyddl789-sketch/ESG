package com.esg.platform.domain.company.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.company.dto.CompanyDto;
import com.esg.platform.domain.company.dto.FacilityDto;
import com.esg.platform.domain.company.mapper.CompanyMapper;
import com.esg.platform.domain.company.mapper.FacilityMapper;
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

    @Transactional(readOnly = true)
    public CompanyDto getCompany() {
        return companyMapper.findById(COMPANY_ID);
    }

    @Transactional
    public CompanyDto updateCompany(CompanyDto dto) {
        dto.setId(COMPANY_ID);
        companyMapper.update(dto);
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
        facilityMapper.insert(COMPANY_ID, dto);
        log.info(
                "[FACILITY] 사업장 등록 companyId={} facilityId={} facilityName={} type={} hasCoordinates={}",
                COMPANY_ID,
                dto.getId(),
                dto.getFacilityName(),
                dto.getFacilityType(),
                dto.getLatitude() != null && dto.getLongitude() != null);
        return getFacility(dto.getId());
    }

    @Transactional
    public FacilityDto updateFacility(Long id, FacilityDto dto) {
        getFacility(id);
        dto.setId(id);
        int updated = facilityMapper.update(COMPANY_ID, dto);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_FOUND);
        }
        log.info(
                "[FACILITY] 사업장 수정 companyId={} facilityId={} facilityName={} hasCoordinates={}",
                COMPANY_ID,
                id,
                dto.getFacilityName(),
                dto.getLatitude() != null && dto.getLongitude() != null);
        return getFacility(id);
    }

    @Transactional
    public void deleteFacility(Long id) {
        getFacility(id);
        int deleted = facilityMapper.delete(id, COMPANY_ID);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.FACILITY_NOT_FOUND);
        }
        log.info("[FACILITY] 사업장 삭제 companyId={} facilityId={}", COMPANY_ID, id);
    }
}
