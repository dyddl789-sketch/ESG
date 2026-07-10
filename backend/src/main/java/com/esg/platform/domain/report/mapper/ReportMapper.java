// 파일 위치: src/main/java/com/esg/platform/domain/report/mapper/ReportMapper.java
// 버전: v1.2.0
// 기능 요약: MyBatis 매퍼 인터페이스로, 템플릿 목록 조회 및 보고서 저장/조회 기능을 정의합니다. 기존 로직이 요구사항을 충족하므로 내용을 유지하고 버전 주석을 갱신합니다.
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