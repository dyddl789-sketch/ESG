package com.esg.platform.domain.ai.service;

import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.esg.platform.global.operation.OperationEvent;
import com.esg.platform.global.operation.RedisOperationService;
import com.esg.platform.global.realtime.EsgWebSocketHandler;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AiAnalysisJobService {
    private final GeminiAiService geminiAiService;
    private final RedisOperationService redisOperationService;
    private final EsgWebSocketHandler webSocketHandler;
    private final Executor aiTaskExecutor;

    public AiAnalysisJobService(
            GeminiAiService geminiAiService,
            RedisOperationService redisOperationService,
            EsgWebSocketHandler webSocketHandler,
            @Qualifier("aiTaskExecutor") Executor aiTaskExecutor
    ) {
        this.geminiAiService = geminiAiService;
        this.redisOperationService = redisOperationService;
        this.webSocketHandler = webSocketHandler;
        this.aiTaskExecutor = aiTaskExecutor;
    }

    public void submit(String domain, String prompt, String jobId) {
        aiTaskExecutor.execute(() -> execute(domain, prompt, jobId));
    }

    private void execute(String domain, String prompt, String jobId) {
        publish(OperationEvent.of(
                "AI_ANALYSIS_PROGRESS",
                domain,
                jobId,
                "PROCESSING",
                35,
                "Gemini 모델에 ESG 검토를 요청하고 있습니다."));

        try {
            String summary = geminiAiService.analyze(domain, prompt);
            publish(OperationEvent.completedWithResult(
                    "AI_ANALYSIS_COMPLETED",
                    domain,
                    jobId,
                    "AI 분석이 완료되었습니다.",
                    summary));
            log.info("Gemini async analysis completed domain={} jobId={}", domain, jobId);
        } catch (RuntimeException exception) {
            String message = exception.getMessage() == null || exception.getMessage().isBlank()
                    ? "Gemini AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요."
                    : exception.getMessage();

            publish(OperationEvent.of(
                    "AI_ANALYSIS_FAILED",
                    domain,
                    jobId,
                    "FAILED",
                    100,
                    message));
            log.warn("Gemini async analysis failed domain={} jobId={} reason={}", domain, jobId, message);
        }
    }

    private void publish(OperationEvent event) {
        redisOperationService.saveJob(event);
        webSocketHandler.broadcast(event);
    }
}
