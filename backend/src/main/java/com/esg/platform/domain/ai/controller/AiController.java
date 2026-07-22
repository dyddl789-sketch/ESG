package com.esg.platform.domain.ai.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.ai.dto.AiAnalyzeRequest;
import com.esg.platform.domain.ai.service.AiAnalysisJobService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.esg.platform.global.operation.OperationEvent;
import com.esg.platform.global.operation.RedisOperationService;
import com.esg.platform.global.realtime.EsgWebSocketHandler;
import com.esg.platform.global.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/manager/ai")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
public class AiController {
    private final AiAnalysisJobService aiAnalysisJobService;
    private final RedisOperationService redisOperationService;
    private final EsgWebSocketHandler webSocketHandler;

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<Map<String, String>>> analyze(
            @Valid @RequestBody AiAnalyzeRequest request
    ) {
        String jobId = "ai-" + UUID.randomUUID();
        OperationEvent started = OperationEvent.of(
                "AI_ANALYSIS_STARTED",
                request.domain(),
                jobId,
                "PROCESSING",
                10,
                "Gemini AI 분석 요청을 접수했습니다.");
        publish(started);

        try {
            aiAnalysisJobService.submit(request.domain(), request.prompt(), jobId);
        } catch (RuntimeException exception) {
            String message = "AI 분석 작업을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.";
            publish(OperationEvent.of(
                    "AI_ANALYSIS_FAILED",
                    request.domain(),
                    jobId,
                    "FAILED",
                    100,
                    message));
            log.warn("Gemini async job submission failed domain={} jobId={}", request.domain(), jobId, exception);
            throw new BusinessException(ErrorCode.GEMINI_API_ERROR, message);
        }

        log.info("Gemini async analysis accepted domain={} jobId={}", request.domain(), jobId);
        return ResponseEntity.accepted().body(ApiResponse.ok(Map.of(
                "jobId", jobId,
                "status", "PROCESSING"
        )));
    }

    private void publish(OperationEvent event) {
        redisOperationService.saveJob(event);
        webSocketHandler.broadcast(event);
    }
}
