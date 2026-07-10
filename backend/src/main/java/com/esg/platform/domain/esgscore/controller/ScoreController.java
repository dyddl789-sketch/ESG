package com.esg.platform.domain.esgscore.controller;

import com.esg.platform.domain.esgscore.dto.ScoreDto;
import com.esg.platform.domain.esgscore.service.ScoreService;
import com.esg.platform.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScoreDto>>> getScores(
            @RequestParam(name = "reporting_period", defaultValue = "YEARLY") String reportingPeriod) {
        List<ScoreDto> scores = scoreService.getScores(reportingPeriod);
        return ResponseEntity.ok(ApiResponse.ok(scores));
    }
}