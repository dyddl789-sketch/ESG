package com.esg.platform.domain.esgscore.mapper;

import com.esg.platform.domain.esgscore.dto.ScoreDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ScoreMapper {
    List<ScoreDto> findByPeriod(@Param("reportingPeriod") String reportingPeriod);
}