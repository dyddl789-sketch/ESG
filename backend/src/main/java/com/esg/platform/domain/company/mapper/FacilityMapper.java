package com.esg.platform.domain.company.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.company.dto.FacilityDto;

@Mapper
public interface FacilityMapper {

    List<FacilityDto> findAllByCompanyId(@Param("companyId") Long companyId);

    FacilityDto findByIdAndCompanyId(
            @Param("id") Long id,
            @Param("companyId") Long companyId);

    void insert(
            @Param("companyId") Long companyId,
            @Param("dto") FacilityDto dto);

    int update(
            @Param("companyId") Long companyId,
            @Param("dto") FacilityDto dto);

    int delete(
            @Param("id") Long id,
            @Param("companyId") Long companyId);
}
