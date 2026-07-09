package com.esg.platform.domain.company.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.company.dto.CompanyDto;

@Mapper
public interface CompanyMapper {
	CompanyDto findById(@Param("id") Long id);
	void update(CompanyDto dto);
}
