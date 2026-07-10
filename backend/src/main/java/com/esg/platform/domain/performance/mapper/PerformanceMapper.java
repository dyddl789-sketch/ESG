package com.esg.platform.domain.performance.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface PerformanceMapper {
    List<Map<String, Object>> selectPerformanceList(@Param("companyId") Long companyId, @Param("year") int year);
}