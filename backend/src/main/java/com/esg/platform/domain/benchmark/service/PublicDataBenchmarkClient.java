package com.esg.platform.domain.benchmark.service;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublicDataBenchmarkClient {

    private static final int MAX_LOG_BODY_LENGTH = 1000;

    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    @Value("${external-api.korea-energy-agency.base-url}")
    private String keaBaseUrl;

    @Value("${external-api.korea-energy-agency.service-key:}")
    private String keaServiceKey;

    @Value("${external-api.kosis.base-url}")
    private String kosisBaseUrl;

    @Value("${external-api.kosis.api-key:}")
    private String kosisApiKey;

    public FetchedValue fetchKea(
            int baseYear,
            String industryCode,
            String dataDivision,
            String metricCode) {
        requireKey(keaServiceKey, "한국에너지공단");
        URI uri = UriComponentsBuilder.fromUriString(baseEndpoint(keaBaseUrl))
                .queryParam("serviceKey", keaServiceKey.trim())
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 100)
                .queryParam("apiType", "JSON")
                .queryParam("q1", baseYear)
                .queryParam("q2", industryCode)
                .queryParam("q3", dataDivision)
                .queryParam("q4", "전력")
                .queryParam("q5", "전력")
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        String body = get(uri, "한국에너지공단");
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode fields = root.path("opentable").path("field");
            if (!fields.isArray() || fields.isEmpty()) {
                throw new BusinessException(
                        ErrorCode.INVALID_INPUT,
                        "한국에너지공단에서 " + baseYear + "년 " + industryCode + " 데이터를 찾지 못했습니다.");
            }
            JsonNode row = fields.get(0);
            BigDecimal original = decimal(row.path("USEMS_QNTY_NIDVAL").asText());
            String originalUnit = row.path("UNIT_NM").asText();
            BigDecimal normalized;
            String normalizedUnit;
            if ("GHG".equals(dataDivision)) {
                normalized = originalUnit.contains("천")
                        ? original.multiply(BigDecimal.valueOf(1000))
                        : original;
                normalizedUnit = "tCO2eq";
            } else {
                // 천kWh의 수치값은 MWh와 동일하다.
                normalized = originalUnit.contains("천kWh")
                        ? original
                        : original.divide(BigDecimal.valueOf(1000));
                normalizedUnit = "MWh";
            }
            return new FetchedValue(
                    "KEA",
                    "GHG_LIST_01_08_VIEW",
                    metricCode,
                    original,
                    originalUnit,
                    normalized,
                    normalizedUnit,
                    row.path("DATA_REG_DT").asText(null),
                    row.toString());
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            log.warn("[EXTERNAL_BENCHMARK] KEA 응답 해석 실패 reason={} body={}",
                    exception.getMessage(), abbreviate(body));
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "한국에너지공단 응답을 해석하지 못했습니다.");
        }
    }

    public FetchedValue fetchKosisShipment(int baseYear, String industryCode) {
        requireKey(kosisApiKey, "KOSIS");

        // KOSIS URL 생성 화면과 동일하게 분류1은 ALL로 요청한 뒤 전국(C1=00) 행만 선별한다.
        // 환경변수에 전체 생성 URL을 잘못 넣어도 query string을 제거하고 엔드포인트만 사용한다.
        URI uri = UriComponentsBuilder.fromUriString(baseEndpoint(kosisBaseUrl))
                .queryParam("method", "getList")
                .queryParam("apiKey", kosisApiKey.trim())
                .queryParam("itmId", "T02")
                .queryParam("objL1", "ALL")
                .queryParam("objL2", industryCode)
                .queryParam("objL3", "")
                .queryParam("objL4", "")
                .queryParam("objL5", "")
                .queryParam("objL6", "")
                .queryParam("objL7", "")
                .queryParam("objL8", "")
                .queryParam("format", "json")
                .queryParam("jsonVD", "Y")
                .queryParam("prdSe", "Y")
                .queryParam("startPrdDe", baseYear)
                .queryParam("endPrdDe", baseYear)
                .queryParam("orgId", "101")
                .queryParam("tblId", "DT_1FS1104")
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        String body = get(uri, "KOSIS");
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode rows = resolveRows(root);
            if (!rows.isArray()) {
                throw kosisApiException(root);
            }

            JsonNode target = null;
            for (JsonNode row : rows) {
                if ("00".equals(row.path("C1").asText())
                        && industryCode.equals(row.path("C2").asText())
                        && "T02".equals(row.path("ITM_ID").asText())
                        && String.valueOf(baseYear).equals(row.path("PRD_DE").asText())) {
                    target = row;
                    break;
                }
            }
            if (target == null) {
                log.warn("[EXTERNAL_BENCHMARK] KOSIS 목표 행 없음 year={} industry={} body={}",
                        baseYear, industryCode, abbreviate(body));
                throw new BusinessException(
                        ErrorCode.INVALID_INPUT,
                        "KOSIS에서 " + baseYear + "년 전국 " + industryCode + " 출하액 계 데이터를 찾지 못했습니다.");
            }

            BigDecimal original = decimal(target.path("DT").asText());
            return new FetchedValue(
                    "KOSIS",
                    target.path("TBL_ID").asText("DT_1FS1104"),
                    "SHIPMENT",
                    original,
                    target.path("UNIT_NM").asText("백만원"),
                    original.divide(BigDecimal.valueOf(100)),
                    "억원",
                    target.path("LST_CHN_DE").asText(null),
                    target.toString());
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            log.warn("[EXTERNAL_BENCHMARK] KOSIS 응답 해석 실패 reason={} body={}",
                    exception.getMessage(), abbreviate(body));
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "KOSIS 응답을 해석하지 못했습니다.");
        }
    }

    private JsonNode resolveRows(JsonNode root) {
        if (root == null) {
            return objectMapper.createArrayNode();
        }
        if (root.isArray()) {
            return root;
        }
        if (root.path("data").isArray()) {
            return root.path("data");
        }
        if (root.path("result").isArray()) {
            return root.path("result");
        }
        return root;
    }

    private BusinessException kosisApiException(JsonNode root) {
        String code = firstText(root, "err", "errorCode", "code", "status");
        String message = firstText(root, "errMsg", "errorMessage", "message", "msg");

        log.warn("[EXTERNAL_BENCHMARK] KOSIS 오류 응답 code={} message={} body={}",
                code, message, abbreviate(root == null ? null : root.toString()));

        if (message == null || message.isBlank()) {
            message = "KOSIS가 오류 응답을 반환했습니다. 인증키와 API 기본 URL을 확인해 주세요.";
        }
        if (code != null && !code.isBlank()) {
            message = "KOSIS API 오류(" + code + "): " + message;
        }
        return new BusinessException(ErrorCode.INVALID_INPUT, message);
    }

    private String firstText(JsonNode root, String... fieldNames) {
        if (root == null) {
            return null;
        }
        for (String fieldName : fieldNames) {
            JsonNode value = root.path(fieldName);
            if (!value.isMissingNode() && !value.isNull()) {
                String text = value.asText();
                if (text != null && !text.isBlank()) {
                    return text;
                }
            }
        }
        return null;
    }

    private String baseEndpoint(String configuredUrl) {
        if (configuredUrl == null || configuredUrl.isBlank()) {
            return configuredUrl;
        }
        int queryIndex = configuredUrl.indexOf('?');
        String endpoint = queryIndex >= 0 ? configuredUrl.substring(0, queryIndex) : configuredUrl;
        int fragmentIndex = endpoint.indexOf('#');
        return (fragmentIndex >= 0 ? endpoint.substring(0, fragmentIndex) : endpoint).trim();
    }

    private String get(URI uri, String sourceName) {
        try {
            String body = restClient.get().uri(uri).retrieve().body(String.class);
            if (body == null || body.isBlank()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, sourceName + " 응답이 비어 있습니다.");
            }
            return body;
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            log.warn("[EXTERNAL_BENCHMARK] API 호출 실패 source={} reason={}", sourceName, exception.getMessage());
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, sourceName + " API 호출에 실패했습니다.");
        }
    }

    private String abbreviate(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.length() <= MAX_LOG_BODY_LENGTH
                ? normalized
                : normalized.substring(0, MAX_LOG_BODY_LENGTH) + "...";
    }

    private BigDecimal decimal(String value) {
        try {
            return new BigDecimal(value.replace(",", "").trim());
        } catch (RuntimeException exception) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "공공데이터 수치 형식이 올바르지 않습니다.");
        }
    }

    private void requireKey(String key, String sourceName) {
        if (key == null || key.isBlank()) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    sourceName + " API 인증키가 설정되지 않았습니다. 환경변수를 확인해 주세요.");
        }
    }

    public record FetchedValue(
            String sourceCode,
            String datasetCode,
            String metricCode,
            BigDecimal originalValue,
            String originalUnit,
            BigDecimal normalizedValue,
            String normalizedUnit,
            String sourceUpdatedAt,
            String rawPayload) {
    }
}
