package com.esg.platform.domain.report.controller;

import com.esg.platform.domain.report.dto.request.ReportCreateRequest;
import com.esg.platform.domain.report.dto.response.ReportResponse;
import com.esg.platform.domain.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody ReportCreateRequest request) {
        // TODO: Spring Security ContextHolder를 통한 유저 ID 획득 로직으로 대체
        Long currentUserId = 1L; 
        
        ReportResponse response = reportService.createReport(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}