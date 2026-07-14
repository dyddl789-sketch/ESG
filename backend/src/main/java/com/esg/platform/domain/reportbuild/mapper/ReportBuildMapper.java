package com.esg.platform.domain.reportbuild.mapper;

import com.esg.platform.domain.reportbuild.entity.GeneratedReport;
import com.esg.platform.domain.reportbuild.entity.ReportTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Optional;

@Mapper
public interface ReportBuildMapper {
    List<ReportTemplate> selectReportTemplates();
    Optional<ReportTemplate> selectReportTemplateById(@Param("id") Long id);
    
    int insertGeneratedReport(GeneratedReport report);
    Optional<GeneratedReport> selectGeneratedReportById(@Param("id") Long id);
    
    List<GeneratedReport> selectGeneratedReports();
    
    int updateReportPublicStatus(@Param("id") Long id, @Param("isPublic") Boolean isPublic);
    int deleteGeneratedReport(@Param("id") Long id);
}