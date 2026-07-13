// 기능 요약: 템플릿 전체 목록을 조회하여 DTO로 변환 반환하는 getTemplates() 메서드와 필요한 List, Collectors 임포트를 추가합니다.
package com.esg.platform.domain.reportbuild.service;

import com.esg.platform.domain.reportbuild.dto.request.ReportCreateRequest;
import com.esg.platform.domain.reportbuild.dto.response.ReportBuildResponse;
import com.esg.platform.domain.reportbuild.dto.response.ReportTemplateResponse;
import com.esg.platform.domain.reportbuild.entity.GeneratedReport;
import com.esg.platform.domain.reportbuild.exception.ReportNotFoundException;
import com.esg.platform.domain.reportbuild.mapper.ReportBuildMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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
    public ReportBuildResponse createReport(ReportCreateRequest request, Long userId) {
        // 템플릿 존재 여부 검증
        reportMapper.selectReportTemplateById(request.getTemplateId())
                .orElseThrow(() -> new ReportNotFoundException("유효하지 않은 템플릿입니다. ID: " + request.getTemplateId()));

        GeneratedReport report = GeneratedReport.builder()
        		.companyId(1L) // [추가] 임시 하드코딩. 향후 로그인된 유저의 회사 ID로 치환 필요
        		.templateId(request.getTemplateId())
        		.title(request.getTitle())
        		.content(request.getContent())
        		.targetYear(request.getTargetYear()) // [추가]
        		.scope(request.getScope())           // [추가]
        		.version(request.getVersion())
        		.fileUrl(request.getFileUrl())
        		.isPublic(request.getIsPublic())
        		.generatedBy(userId)
        		.build();

        reportMapper.insertGeneratedReport(report); // DB Insert

        return reportMapper.selectGeneratedReportById(report.getId())
                .map(ReportBuildResponse::from)
                .orElseThrow(() -> new RuntimeException("보고서 저장 중 오류가 발생했습니다."));
    }
}