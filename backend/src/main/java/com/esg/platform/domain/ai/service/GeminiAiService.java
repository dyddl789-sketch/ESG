package com.esg.platform.domain.ai.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GeminiAiService {
    private final RestClient restClient;

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-3.5-flash}")
    private String model;

    @Value("${app.gemini.fallback-model:gemini-3-flash-preview}")
    private String fallbackModel;

    @Value("${app.gemini.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.gemini.retry-delay-ms:1000}")
    private long retryDelayMs;

    @Value("${app.gemini.max-output-tokens:240}")
    private int maxOutputTokens;

    public GeminiAiService(
            @Value("${app.gemini.connect-timeout:5s}") Duration connectTimeout,
            @Value("${app.gemini.read-timeout:45s}") Duration readTimeout
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);

        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(requestFactory)
                .build();
    }

    public String analyze(String domain, String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY가 설정되지 않았습니다.");
        }

        Map<String, Object> body = createRequestBody(domain, prompt);
        RuntimeException lastException = null;

        for (String targetModel : configuredModels()) {
            try {
                return requestWithRetry(targetModel, body, domain);
            } catch (ModelNotAvailableException | TemporaryGeminiException exception) {
                lastException = exception;
                log.warn("Gemini model unavailable after retries domain={} model={} reason={}",
                        domain,
                        targetModel,
                        exception.getMessage());
            }
        }

        if (lastException instanceof ModelNotAvailableException) {
            throw new IllegalStateException(
                    "설정된 Gemini 모델을 사용할 수 없습니다. GEMINI_MODEL과 GEMINI_FALLBACK_MODEL을 확인해 주세요.");
        }

        throw new IllegalStateException(
                "Gemini 서비스가 현재 혼잡합니다. 잠시 후 다시 시도해 주세요.");
    }

    private Set<String> configuredModels() {
        Set<String> models = new LinkedHashSet<>();
        if (model != null && !model.isBlank()) {
            models.add(model.trim());
        }
        if (fallbackModel != null && !fallbackModel.isBlank()) {
            models.add(fallbackModel.trim());
        }
        return models;
    }

    private Map<String, Object> createRequestBody(String domain, String prompt) {
        String instruction = "당신은 제조업 ESG 보고서 작성 보조자입니다. "
                + "제공된 데이터와 요청만 근거로 핵심 내용을 3개 이내로 요약하세요. "
                + "수치를 만들거나 승인 여부를 결정하지 말고, 전체 답변은 한국어 300자 이내로 작성하세요. "
                + "영역: " + domain + "\n"
                + prompt;

        return Map.of(
                "contents",
                List.of(Map.of(
                        "parts",
                        List.of(Map.of("text", instruction)))),
                "generationConfig",
                Map.of(
                        "temperature", 0.2,
                        "maxOutputTokens", Math.max(80, Math.min(maxOutputTokens, 500)))
        );
    }

    private String requestWithRetry(String targetModel, Map<String, Object> body, String domain) {
        int attempts = Math.max(1, maxAttempts);
        long baseDelay = Math.max(0L, retryDelayMs);

        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                Map<?, ?> response = restClient.post()
                        .uri("/v1beta/models/{model}:generateContent", targetModel)
                        .header("x-goog-api-key", apiKey)
                        .body(body)
                        .retrieve()
                        .body(Map.class);

                return extractText(response);
            } catch (RestClientResponseException exception) {
                int status = exception.getStatusCode().value();
                String responseBody = abbreviate(exception.getResponseBodyAsString(), 500);
                log.warn(
                        "Gemini API request failed domain={} model={} status={} attempt={}/{} body={}",
                        domain,
                        targetModel,
                        status,
                        attempt,
                        attempts,
                        responseBody);

                if (status == 404) {
                    throw new ModelNotAvailableException("모델을 찾을 수 없습니다: " + targetModel);
                }

                if (status == 400 || status == 401 || status == 403) {
                    throw new IllegalStateException(
                            "Gemini API 키, 모델 권한 또는 요청 설정을 확인해 주세요.");
                }

                if (isTransientStatus(status)) {
                    if (attempt < attempts) {
                        sleepWithBackoff(baseDelay, attempt);
                        continue;
                    }
                    throw new TemporaryGeminiException(
                            "Gemini 일시 오류가 반복되었습니다. HTTP 상태: " + status);
                }

                throw new IllegalStateException(
                        "Gemini API 호출에 실패했습니다. HTTP 상태: " + status);
            } catch (RestClientException exception) {
                log.warn(
                        "Gemini API connection failed domain={} model={} attempt={}/{}",
                        domain,
                        targetModel,
                        attempt,
                        attempts,
                        exception);

                if (attempt < attempts) {
                    sleepWithBackoff(baseDelay, attempt);
                    continue;
                }

                throw new TemporaryGeminiException(
                        "Gemini API 서버 응답이 지연되거나 연결이 불안정합니다.");
            }
        }

        throw new TemporaryGeminiException("Gemini API 요청이 완료되지 않았습니다.");
    }

    private boolean isTransientStatus(int status) {
        return status == 408
                || status == 429
                || status == 500
                || status == 502
                || status == 503
                || status == 504;
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> response) {
        if (response == null) {
            throw new IllegalStateException("Gemini API가 빈 응답을 반환했습니다.");
        }

        Object candidateObject = response.get("candidates");
        if (!(candidateObject instanceof List<?> candidates) || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini API 응답에 분석 결과가 없습니다.");
        }

        Object firstCandidate = candidates.get(0);
        if (!(firstCandidate instanceof Map<?, ?> candidate)) {
            throw new IllegalStateException("Gemini API 응답 형식을 해석하지 못했습니다.");
        }

        Object contentObject = candidate.get("content");
        if (!(contentObject instanceof Map<?, ?> content)) {
            throw new IllegalStateException("Gemini API 응답에 본문이 없습니다.");
        }

        Object partsObject = content.get("parts");
        if (!(partsObject instanceof List<?> parts) || parts.isEmpty()) {
            throw new IllegalStateException("Gemini API 응답에 텍스트가 없습니다.");
        }

        List<String> texts = new ArrayList<>();
        for (Object partObject : parts) {
            if (partObject instanceof Map<?, ?> part && part.get("text") != null) {
                texts.add(String.valueOf(part.get("text")));
            }
        }

        if (texts.isEmpty()) {
            throw new IllegalStateException("Gemini API 응답에 텍스트가 없습니다.");
        }

        return String.join("\n", texts);
    }

    private void sleepWithBackoff(long baseDelay, int attempt) {
        if (baseDelay <= 0) {
            return;
        }

        long multiplier = 1L << Math.min(attempt - 1, 4);
        long jitter = ThreadLocalRandom.current().nextLong(0, 251);
        long delay = Math.min(baseDelay * multiplier + jitter, 15_000L);

        try {
            Thread.sleep(delay);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new TemporaryGeminiException("Gemini 재시도 대기 중 작업이 중단되었습니다.");
        }
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }

    private static final class TemporaryGeminiException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        private TemporaryGeminiException(String message) {
            super(message);
        }
    }

    private static final class ModelNotAvailableException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        private ModelNotAvailableException(String message) {
            super(message);
        }
    }
}
