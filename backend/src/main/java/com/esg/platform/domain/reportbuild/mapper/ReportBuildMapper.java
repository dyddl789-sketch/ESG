package com.esg.platform.domain.reportbuild.mapper;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.reportbuild.entity.GeneratedReport;
import com.esg.platform.domain.reportbuild.entity.ReportTemplate;

@Mapper
public interface ReportBuildMapper {

    List<ReportTemplate> selectReportTemplates();

    Optional<ReportTemplate> selectReportTemplateById(@Param("id") Long id);

    int insertGeneratedReport(GeneratedReport report);

    Optional<GeneratedReport> selectGeneratedReportById(@Param("id") Long id);

    List<GeneratedReport> selectGeneratedReportsByCompanyId(@Param("companyId") Long companyId);

    int updateReportPublicStatus(
            @Param("id") Long id,
            @Param("isPublic") Boolean isPublic,
            @Param("companyId") Long companyId);

    int deleteGeneratedReport(
            @Param("id") Long id,
            @Param("companyId") Long companyId);

    List<String> selectFacilityNamesByCompanyId(@Param("companyId") Long companyId);
}
