package com.esg.platform.domain.reportbuild.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.reportbuild.dto.request.ReportCreateRequest;
import com.esg.platform.domain.reportbuild.dto.response.ReportBuildResponse;
import com.esg.platform.domain.reportbuild.dto.response.ReportMetricResponse;
import com.esg.platform.domain.reportbuild.dto.response.ReportTemplateResponse;
import com.esg.platform.domain.reportbuild.entity.GeneratedReport;
import com.esg.platform.domain.reportbuild.exception.ReportNotFoundException;
import com.esg.platform.domain.reportbuild.mapper.ReportBuildMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportBuildService {

    private final ReportBuildMapper reportMapper;

    public ReportTemplateResponse getReportTemplate(Long id) {
        return reportMapper.selectReportTemplateById(id)
                .map(ReportTemplateResponse::from)
                .orElseThrow(() -> new ReportNotFoundException("해당 리포트 템플릿을 찾을 수 없습니다. ID: " + id));
    }

    public List<ReportTemplateResponse> getTemplates() {
        return reportMapper.selectReportTemplates().stream()
                .map(ReportTemplateResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReportBuildResponse createReport(ReportCreateRequest request, Long userId, Long companyId) {
        reportMapper.selectReportTemplateById(request.getTemplateId())
                .orElseThrow(() -> new ReportNotFoundException("유효하지 않은 템플릿입니다. ID: " + request.getTemplateId()));

        GeneratedReport report = GeneratedReport.builder()
                .companyId(companyId)
                .templateId(request.getTemplateId())
                .title(request.getTitle())
                .content(request.getContent())
                .targetYear(request.getTargetYear())
                .scope(request.getScope())
                .version(request.getVersion())
                .fileUrl(normalizeFileUrl(request.getFileUrl()))
                .isPublic(Boolean.TRUE.equals(request.getIsPublic()))
                .generatedBy(userId)
                .build();

        reportMapper.insertGeneratedReport(report);
        log.info("[REPORT] 보고서 저장 완료 reportId={} companyId={} userId={}",
                report.getId(), companyId, userId);

        return reportMapper.selectGeneratedReportById(report.getId())
                .map(ReportBuildResponse::from)
                .orElseThrow(() -> new ReportNotFoundException("저장된 보고서를 다시 조회하지 못했습니다. ID: " + report.getId()));
    }

    public List<ReportBuildResponse> getGeneratedReports(Long companyId) {
        return reportMapper.selectGeneratedReportsByCompanyId(companyId).stream()
                .map(ReportBuildResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void togglePublicStatus(Long id, Boolean isPublic, Long companyId) {
        int updatedCount = reportMapper.updateReportPublicStatus(id, Boolean.TRUE.equals(isPublic), companyId);
        if (updatedCount == 0) {
            throw new ReportNotFoundException("해당 기업의 보고서를 찾을 수 없습니다. ID: " + id);
        }
        log.info("[REPORT] 공개 상태 변경 reportId={} companyId={} isPublic={}", id, companyId, isPublic);
    }

    @Transactional
    public void deleteReport(Long id, Long companyId) {
        int deletedCount = reportMapper.deleteGeneratedReport(id, companyId);
        if (deletedCount == 0) {
            throw new ReportNotFoundException("해당 기업의 보고서를 찾을 수 없습니다. ID: " + id);
        }
        log.info("[REPORT] 보고서 삭제 reportId={} companyId={}", id, companyId);
    }

    public List<String> getFacilities(Long companyId) {
        log.debug("[REPORT] 사업장 목록 조회 companyId={}", companyId);
        return reportMapper.selectFacilityNamesByCompanyId(companyId);
    }

    // [신규 추가] 리포트 빌더에 매핑될 그룹화되지 않은 원본 실적 리스트를 반환합니다.
    public List<ReportMetricResponse> getReportMetrics(Long companyId, int year) {
        log.info("[REPORT] 보고서 작성용 원본 실적 데이터 조회 companyId={} year={}", companyId, year);
        return reportMapper.selectRawMetricsForReport(companyId, year);
    }

    private String normalizeFileUrl(String fileUrl) {
        return fileUrl == null ? "" : fileUrl.trim();
    }
}
