package com.esg.platform.domain.esgindicator.mapper;

import com.esg.platform.domain.esgindicator.dto.IndicatorDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface IndicatorMapper {
    List<IndicatorDto> findAll();
    IndicatorDto findById(@Param("id") Long id);
    void insert(IndicatorDto dto);
    void update(IndicatorDto dto);
    void delete(@Param("id") Long id);
}