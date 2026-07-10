package com.esg.platform.domain.esgindicator.controller;

import com.esg.platform.domain.esgindicator.dto.IndicatorDto;
import com.esg.platform.domain.esgindicator.service.IndicatorService;
import com.esg.platform.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/indicators")
@RequiredArgsConstructor
public class IndicatorController {

    private final IndicatorService indicatorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IndicatorDto>>> getIndicators() {
        List<IndicatorDto> indicators = indicatorService.getIndicators();
        return ResponseEntity.ok(ApiResponse.ok(indicators));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IndicatorDto>> createIndicator(@RequestBody IndicatorDto dto) {
        IndicatorDto created = indicatorService.createIndicator(dto);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IndicatorDto>> updateIndicator(
            @PathVariable("id") Long id,
            @RequestBody IndicatorDto dto) {
        IndicatorDto updated = indicatorService.updateIndicator(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIndicator(@PathVariable("id") Long id) {
        indicatorService.deleteIndicator(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}