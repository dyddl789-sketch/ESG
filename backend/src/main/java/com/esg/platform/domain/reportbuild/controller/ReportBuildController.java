// 파일 위치: src/main/java/com/esg/platform/domain/reportbuild/controller/ReportBuildController.java
package com.esg.platform.domain.reportbuild.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.reportbuild.dto.request.ReportCreateRequest;
import com.esg.platform.domain.reportbuild.dto.response.ReportBuildResponse;
import com.esg.platform.domain.reportbuild.dto.response.ReportTemplateResponse;
import com.esg.platform.domain.reportbuild.service.ReportBuildService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportBuildController {

    private final ReportBuildService reportService;

    @PostMapping
    public ResponseEntity<ReportBuildResponse> createReport(@Valid @RequestBody ReportCreateRequest request) {
        // TODO: Spring Security ContextHolder를 통한 유저 ID 획득 로직으로 대체
        Long currentUserId = 1L; 
        
        ReportBuildResponse response = reportService.createReport(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/templates")
    public ResponseEntity<List<ReportTemplateResponse>> getTemplates() {
        return ResponseEntity.ok(reportService.getTemplates());
    }

    // 관리자용 작성 이력 아카이브 조회
    @GetMapping
    public ResponseEntity<List<ReportBuildResponse>> getGeneratedReports() {
        return ResponseEntity.ok(reportService.getGeneratedReports());
    }

    // 대외 공시 1/0 (true/false) 스위치 토글 기능
    @PatchMapping("/{id}/public")
    public ResponseEntity<Void> togglePublicStatus(@PathVariable("id") Long id, @RequestParam("isPublic") Boolean isPublic) {
        reportService.togglePublicStatus(id, isPublic);
        return ResponseEntity.ok().build();
    }

    //  보고서 완전 삭제 기능
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable("id") Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}