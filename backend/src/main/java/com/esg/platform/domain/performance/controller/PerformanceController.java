package com.esg.platform.domain.performance.controller;

import com.esg.platform.domain.performance.dto.response.PerformanceResponse;
import com.esg.platform.domain.performance.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPerformanceList(
            @RequestParam(name = "year", defaultValue = "2026") int year) {
        
        // 향후 JWT/SecurityContext에서 현재 로그인한 회원의 companyId 추출 연동 예정
        Long companyId = 1L; 
        
        List<PerformanceResponse> data = performanceService.getPerformanceList(companyId, year);
        
        return ResponseEntity.ok(Map.of("data", data));
    }
}