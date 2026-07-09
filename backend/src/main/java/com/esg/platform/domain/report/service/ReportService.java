package com.esg.platform.domain.report.service;

import com.esg.platform.domain.report.dto.request.ReportCreateRequest;
import com.esg.platform.domain.report.dto.response.ReportResponse;
import com.esg.platform.domain.report.dto.response.ReportTemplateResponse;
import com.esg.platform.domain.report.entity.GeneratedReport;
import com.esg.platform.domain.report.exception.ReportNotFoundException;
import com.esg.platform.domain.report.mapper.ReportMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportMapper reportMapper;

    public ReportTemplateResponse getReportTemplate(Long id) {
        return reportMapper.selectReportTemplateById(id)
                .map(ReportTemplateResponse::from)
                .orElseThrow(() -> new ReportNotFoundException("해당 리포트 템플릿을 찾을 수 없습니다. ID: " + id));
    }

    @Transactional
    public ReportResponse createReport(ReportCreateRequest request, Long userId) {
        // 템플릿 존재 여부 검증
        reportMapper.selectReportTemplateById(request.getTemplateId())
                .orElseThrow(() -> new ReportNotFoundException("유효하지 않은 템플릿입니다. ID: " + request.getTemplateId()));

        GeneratedReport report = GeneratedReport.builder()
                .templateId(request.getTemplateId())
                .title(request.getTitle())
                .content(request.getContent())
                .version(request.getVersion())
                .fileUrl(request.getFileUrl())
                .isPublic(request.getIsPublic())
                .generatedBy(userId)
                .build();

        reportMapper.insertGeneratedReport(report); // DB Insert

        return reportMapper.selectGeneratedReportById(report.getId())
                .map(ReportResponse::from)
                .orElseThrow(() -> new RuntimeException("보고서 저장 중 오류가 발생했습니다."));
    }
}