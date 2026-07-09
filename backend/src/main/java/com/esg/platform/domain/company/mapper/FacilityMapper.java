package com.esg.platform.domain.company.mapper;

import com.esg.platform.domain.company.dto.FacilityDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FacilityMapper {
    List<FacilityDto> findAllByCompanyId(@Param("companyId") Long companyId);
    FacilityDto findById(@Param("id") Long id);
    void insert(@Param("companyId") Long companyId, @Param("dto") FacilityDto dto);
    void update(FacilityDto dto);
    void delete(@Param("id") Long id);
}