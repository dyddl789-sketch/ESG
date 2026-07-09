package com.esg.platform.domain.company.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.company.dto.FacilityDto;

@Mapper
public interface FacilityMapper {
    List<FacilityDto> findAllByCompanyId(Long companyId);
    FacilityDto findById(Long id);
    void insert(@Param("companyId") Long companyId, @Param("dto") FacilityDto dto);
    void update(FacilityDto dto);
    void delete(Long id);
}
