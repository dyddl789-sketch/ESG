package com.esg.platform.domain.company.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.esg.platform.domain.company.dto.CompanyDto;

@Mapper
public interface CompanyMapper {
    CompanyDto findById(Long id);
    void update(CompanyDto dto);
}
