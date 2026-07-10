package com.esg.platform.domain.reportview.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.esg.platform.domain.reportview.dto.ReportDto;

@Mapper
public interface ReportMapper {
    List<ReportDto> findAll();
}