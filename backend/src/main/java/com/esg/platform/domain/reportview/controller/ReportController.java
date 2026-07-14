package com.esg.platform.domain.reportview.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.reportview.dto.ReportDto;
import com.esg.platform.domain.reportview.service.ReportService;
import com.esg.platform.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/public/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportDto>>> getReports() {
        List<ReportDto> reports = reportService.getReports();
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }
}