package com.esg.platform.domain.company.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.esg.platform.domain.company.dto.CompanyDto;
import com.esg.platform.domain.company.dto.FacilityDto;
import com.esg.platform.domain.company.mapper.CompanyMapper;
import com.esg.platform.domain.company.mapper.FacilityMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyMapper companyMapper;
    private final FacilityMapper facilityMapper;

    // 단일 기업 구조이므로 id=1 고정
    private static final Long COMPANY_ID = 1L;

    public CompanyDto getCompany() {
        return companyMapper.findById(COMPANY_ID);
    }

    public CompanyDto updateCompany(CompanyDto dto) {
        dto.setId(COMPANY_ID);
        companyMapper.update(dto);
        return companyMapper.findById(COMPANY_ID);
    }

    public List<FacilityDto> getFacilities() {
        return facilityMapper.findAllByCompanyId(COMPANY_ID);
    }

    public FacilityDto createFacility(FacilityDto dto) {
        facilityMapper.insert(COMPANY_ID, dto);
        return facilityMapper.findById(dto.getId());
    }

    public FacilityDto updateFacility(Long id, FacilityDto dto) {
        dto.setId(id);
        facilityMapper.update(dto);
        return facilityMapper.findById(id);
    }

    public void deleteFacility(Long id) {
        facilityMapper.delete(id);
    }
}
