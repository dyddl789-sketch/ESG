package com.esg.platform.domain.report.mapper;

import com.esg.platform.domain.report.entity.GeneratedReport;
import com.esg.platform.domain.report.entity.ReportTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Optional;

@Mapper
public interface ReportMapper {
    List<ReportTemplate> selectReportTemplates();
    Optional<ReportTemplate> selectReportTemplateById(@Param("id") Long id);
    
    int insertGeneratedReport(GeneratedReport report);
    Optional<GeneratedReport> selectGeneratedReportById(@Param("id") Long id);
}