package com.esg.platform.domain.documentanalysis.service;

import java.io.FileInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.esg.platform.domain.documentanalysis.dto.DocumentAnalysisResponse;
import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.domain.metric.service.MetricService;
import com.esg.platform.domain.metric.service.MetricWorkflowService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional(readOnly = true)
public class DocumentAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(DocumentAnalysisService.class);

    private static final String ELECTRICITY_INDICATOR_CODE = "IND_E_ELEC";
    private static final String SCOPE2_INDICATOR_CODE = "IND_E_SCOPE2";
    private static final String GOVERNANCE_ATTENDANCE_CODE = "IND_G_ATTENDANCE";

    private static final Pattern DATE_PATTERN = Pattern.compile(
            "(20\\d{2})[.\\-/년\\s]+(0?[1-9]|1[0-2])[.\\-/월\\s]+(0[1-9]|[12]\\d|3[01]|[1-9])(?!\\d)");
    private static final Pattern REPORTING_PERIOD_PATTERN = Pattern.compile(
            "보고\\s*기간\\s*[:：]?\\s*(20\\d{2})[.\\-/년\\s]+(0?[1-9]|1[0-2])",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DOCUMENT_DATE_PATTERN = Pattern.compile(
            "보고서\\s*작성일\\s*[:：]?\\s*(20\\d{2})[.\\-/년\\s]+(0?[1-9]|1[0-2])[.\\-/월\\s]+(0[1-9]|[12]\\d|3[01]|[1-9])(?!\\d)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SCOPE2_KEYWORD_PATTERN = Pattern.compile(
            "(?:scope\\s*2|스코프\\s*2)\\s*(?:온실가스\\s*)?배출량|온실가스\\s*배출량",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SCOPE2_VALUE_PATTERN = Pattern.compile(
            "(?:측정값|(?:scope\\s*2|스코프\\s*2)\\s*(?:온실가스\\s*)?배출량|온실가스\\s*배출량)"
                    + "\\s*(?:\\([^)]*\\))?\\s*[:：]?\\s*([\\d,]+(?:\\.\\d+)?)"
                    + "\\s*(tCO(?:2|₂)(?:eq|e))",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern TOTAL_PATTERN = Pattern.compile("(?:전체|총)\\s*(?:이사)?\\s*(?:수)?\\s*[:：]?\\s*(\\d+)\\s*명");
    private static final Pattern ATTENDED_PATTERN = Pattern.compile("(?:참석|출석)\\s*(?:이사)?\\s*(?:수)?\\s*[:：]?\\s*(\\d+)\\s*명");
    private static final Pattern ELECTRICITY_KEYWORD_PATTERN = Pattern.compile(
            "(?:전력\\s*사용량|사용전력량|전력량)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern ELECTRICITY_PATTERN = Pattern.compile(
            "(?:전력\\s*사용량|사용전력량|전력량)\\s*[:：]?\\s*([\\d,]+(?:\\.\\d+)?)\\s*(kWh|MWh|천kWh)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern MEASURED_ELECTRICITY_PATTERN = Pattern.compile(
            "(?:측정값|사용량|합계|총\\s*전력\\s*사용량)\\s*[:：]?\\s*([\\d,]+(?:\\.\\d+)?)\\s*(kWh|MWh|천kWh)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SHIPMENT_PATTERN = Pattern.compile(
            "(?:출하액(?:\\s*계)?)\\s*[:：]?\\s*([\\d,]+(?:\\.\\d+)?)\\s*(억원|백만원|천원|원)");

    private final MetricMapper metricMapper;
    private final MetricService metricService;
    private final MetricWorkflowService workflowService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    private record DocumentSignals(
            boolean scope2Document,
            BigDecimal scope2Value,
            BigDecimal electricityUsageKwh,
            BigDecimal shipmentAmountMillionKrw,
            LocalDate documentDate,
            Integer reportingYear,
            Integer reportingMonth) {
    }

    public DocumentAnalysisService(
            MetricMapper metricMapper,
            MetricService metricService,
            MetricWorkflowService workflowService,
            ObjectMapper objectMapper) {
        this.metricMapper = metricMapper;
        this.metricService = metricService;
        this.workflowService = workflowService;
        this.objectMapper = objectMapper;
    }

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.api.model:gpt-4o-mini}")
    private String model;

    public DocumentAnalysisResponse generateAiHelperData(
            String fileUrl,
            Long companyId,
            Long userId) {
        boolean aiConfigured = apiKey != null && !apiKey.isBlank();
        log.info("[DOCUMENT_AI] 분석 시작 file={} companyId={} userId={} aiConfigured={}",
                maskFileUrl(fileUrl), companyId, userId, aiConfigured);

        Path uploadedFile = resolveUploadedFile(fileUrl);
        String extension = extensionOf(uploadedFile.getFileName().toString());
        String extractedText = extractText(uploadedFile, extension);
        if (extractedText.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "문서에서 분석 가능한 텍스트를 찾지 못했습니다.");
        }

        DocumentSignals signals = analyzeDocumentSignals(extractedText);
        log.info("[DOCUMENT_AI] 텍스트 추출 완료 file={} extension={} textLength={} scope2Keyword={} "
                        + "scope2Value={} electricityKwh={} shipmentMillionKrw={} reportingYear={} reportingMonth={} documentDate={}",
                uploadedFile.getFileName(),
                extension,
                extractedText.length(),
                signals.scope2Document(),
                signals.scope2Value(),
                signals.electricityUsageKwh(),
                signals.shipmentAmountMillionKrw(),
                signals.reportingYear(),
                signals.reportingMonth(),
                signals.documentDate());

        DocumentAnalysisResponse result = aiConfigured
                ? callOpenAi(extractedText, extension, fileUrl, signals)
                : createLocalFallback(extractedText, extension, fileUrl, signals);

        String indicatorCode = result.getIndicatorId() == null
                ? null
                : metricMapper.findIndicatorCodeById(result.getIndicatorId());
        log.info("[DOCUMENT_AI] 최종 분석 결과 file={} category={} indicatorId={} indicatorCode={} "
                        + "year={} month={} value={} electricityKwh={} shipmentMillionKrw={} confidence={}",
                uploadedFile.getFileName(),
                result.getDetectedCategory(),
                result.getIndicatorId(),
                indicatorCode,
                result.getReportingYear(),
                result.getPeriodValue(),
                result.getValue(),
                result.getElectricityUsageKwh(),
                result.getShipmentAmountMillionKrw(),
                result.getConfidence());
        return result;
    }

    @Transactional
    public Long processUserFinalSubmission(
            DocumentAnalysisResponse request,
            Integer companyId,
            Integer inputUserId) {
        if (request == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "최종 등록할 ESG 분석 결과가 필요합니다.");
        }
        if (companyId == null || inputUserId == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "소속 기업과 사용자 정보를 확인할 수 없습니다.");
        }

        Integer electricityIndicatorId = metricMapper.findIndicatorIdByCode(ELECTRICITY_INDICATOR_CODE);
        Integer indicatorId = request.getIndicatorId();
        String indicatorCode = indicatorId == null ? null : metricMapper.findIndicatorCodeById(indicatorId);

        if (indicatorId == null && isPositive(request.getElectricityUsageKwh())) {
            indicatorId = electricityIndicatorId;
            indicatorCode = ELECTRICITY_INDICATOR_CODE;
        }
        boolean electricityDocument = ELECTRICITY_INDICATOR_CODE.equals(indicatorCode);

        Integer facilityId = request.getFacilityId();
        BigDecimal value;
        BigDecimal shipmentAmount = null;
        String textValue;

        if (electricityDocument) {
            if (electricityIndicatorId == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "전력 사용량 지표를 찾을 수 없습니다.");
            }
            indicatorId = electricityIndicatorId;
            value = firstNonNull(request.getElectricityUsageKwh(), request.getValue());
            shipmentAmount = request.getShipmentAmountMillionKrw();

            if (!isPositive(value)) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "전력 사용량(kWh)을 입력해 주세요.");
            }
            if (!isPositive(shipmentAmount)) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "출하액(백만원)을 입력해 주세요.");
            }
            if (facilityId == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "전력·출하액을 등록할 사업장을 선택해 주세요.");
            }
            textValue = buildEnvironmentFinalText(request, value, shipmentAmount);
        } else {
            if (indicatorId == null || indicatorCode == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "AI가 매핑한 ESG 지표를 확인하거나 직접 선택해 주세요.");
            }
            value = firstNonNull(request.getValue(), request.getRate());
            textValue = buildGenericFinalText(request);
            if (value == null && (textValue == null || textValue.isBlank())) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "정량 수치 또는 정성 내용을 입력해 주세요.");
            }
            if (isCompanyWideGovernance(indicatorCode)) {
                facilityId = null;
            } else if ("IND_G_ETHICS_EDU".equals(indicatorCode) && facilityId == null) {
                throw new BusinessException(
                        ErrorCode.INVALID_INPUT,
                        "윤리교육 이수율은 AI 분석 결과를 등록할 대상 사업장을 선택해 주세요.");
            }
        }

        int year = request.getReportingYear() == null ? LocalDate.now().getYear() : request.getReportingYear();
        int periodValue = request.getPeriodValue() == null ? LocalDate.now().getMonthValue() : request.getPeriodValue();
        String periodType = request.getPeriodType() == null || request.getPeriodType().isBlank()
                ? "MONTHLY"
                : request.getPeriodType().trim().toUpperCase();

        Path evidencePath = resolveUploadedFile(request.getFileUrl());
        MetricCreateRequest metricRequest = new MetricCreateRequest(
                indicatorId,
                facilityId,
                year,
                periodType,
                periodValue,
                value,
                shipmentAmount,
                textValue,
                request.getFileUrl(),
                originalEvidenceFilename(request.getFileUrl()),
                MediaType.APPLICATION_PDF_VALUE,
                evidenceFileSize(evidencePath),
                evidenceUploadedAt(evidencePath),
                false);

        Long metricId = metricService.createMetric(metricRequest, companyId, inputUserId);
        if (Boolean.TRUE.equals(request.getSubmitForApproval())) {
            workflowService.requestApproval(metricId, inputUserId.longValue());
        }

        log.info("[DOCUMENT_AI] ESG 등록 완료 metricId={} companyId={} userId={} indicatorId={} indicatorCode={} "
                        + "year={} month={} value={} shipmentMillionKrw={} submit={}",
                metricId,
                companyId,
                inputUserId,
                indicatorId,
                metricMapper.findIndicatorCodeById(indicatorId),
                year,
                periodValue,
                value,
                shipmentAmount,
                Boolean.TRUE.equals(request.getSubmitForApproval()));
        return metricId;
    }

    private DocumentAnalysisResponse callOpenAi(
            String text,
            String extension,
            String fileUrl,
            DocumentSignals signals) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());

            String indicatorContext = buildIndicatorContext(metricMapper.findActiveIndicators());
            String systemPrompt = "대한민국 제조기업의 ESG 증빙문서 분석 도우미다. "
                    + "문서 내용을 읽고 아래 지표 목록 중 가장 적합한 indicatorId와 indicatorCode를 선택하며 "
                    + "반드시 순수 JSON 객체만 반환한다. "
                    + "공통 필드: detectedCategory(ENVIRONMENT/SOCIAL/GOVERNANCE), indicatorId, indicatorCode, "
                    + "reportingYear, periodValue, value, unit, textValue, type, confidence, date. "
                    + "보고서 작성일과 보고 기간이 함께 있으면 date는 작성일, reportingYear와 periodValue는 보고 기간 기준으로 반환한다. "
                    + "Scope 2 또는 온실가스 배출량 문서는 IND_E_SCOPE2로 매핑하고 value와 "
                    + "scope2EmissionTco2eq에 tCO2eq 값을 반환한다. 이 경우 electricityUsageKwh는 실제 전력 사용량 수치가 "
                    + "명시된 경우에만 반환하며, '1kWh 당 0.46 tCO2eq' 같은 배출계수 설명은 전력 사용량이 아니다. "
                    + "전력 사용량 문서는 IND_E_ELEC로 매핑하고 electricityUsageKwh를 kWh로 반환한다. "
                    + "출하액은 shipmentAmountMillionKrw에 백만원 단위로 별도 반환하며 매출액과 구분한다. "
                    + "이사회 문서라면 total, attended, rate, agenda도 반환한다. "
                    + "예시: {\"detectedCategory\":\"ENVIRONMENT\",\"indicatorId\":2,"
                    + "\"indicatorCode\":\"IND_E_SCOPE2\",\"reportingYear\":2026,\"periodValue\":6,"
                    + "\"value\":7.015,\"unit\":\"tCO2eq\",\"scope2EmissionTco2eq\":7.015,"
                    + "\"textValue\":\"한글 3문장 이내 요약\",\"type\":\"Scope 2 온실가스 배출량 보고서\","
                    + "\"confidence\":95,\"date\":\"2026-07-10\",\"electricityUsageKwh\":null,"
                    + "\"shipmentAmountMillionKrw\":1200,\"total\":0,\"attended\":0,"
                    + "\"rate\":null,\"agenda\":\"\"}.\n\n"
                    + "[ESG 지표 마스터 목록]\n" + indicatorContext;

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("response_format", Map.of("type", "json_object"));
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", "[증빙 문서 내용]\n" + truncate(text, 18000))));

            ResponseEntity<String> response = restTemplate.postForEntity(
                    apiUrl,
                    new HttpEntity<>(requestBody, headers),
                    String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new IllegalStateException("AI 응답에 choices가 없습니다.");
            }
            String content = choices.get(0).path("message").path("content").asText();
            JsonNode result = objectMapper.readTree(content);
            return responseFromJson(result, extension, fileUrl, signals);
        } catch (Exception exception) {
            log.warn("[DOCUMENT_AI] OpenAI 호출 실패, 로컬 추출로 대체 reason={}",
                    truncate(exception.getMessage(), 240));
            return createLocalFallback(text, extension, fileUrl, signals);
        }
    }

    private DocumentAnalysisResponse responseFromJson(
            JsonNode result,
            String extension,
            String fileUrl,
            DocumentSignals signals) {
        BigDecimal aiElectricity = parseNullableDecimal(result.path("electricityUsageKwh"));
        BigDecimal aiShipment = parseNullableDecimal(result.path("shipmentAmountMillionKrw"));
        BigDecimal aiScope2 = parseNullableDecimal(result.path("scope2EmissionTco2eq"));
        BigDecimal genericValue = parseNullableDecimal(result.path("value"));

        int total = Math.max(result.path("total").asInt(0), 0);
        int attended = Math.max(result.path("attended").asInt(0), 0);
        if (total > 0 && attended > total) {
            attended = total;
        }
        BigDecimal rate = parseDecimal(result.path("rate").asText(), calculateRate(total, attended));

        String category = result.path("detectedCategory").asText("").trim().toUpperCase();
        Integer rawIndicatorId = result.has("indicatorId") && !result.path("indicatorId").isNull()
                ? result.path("indicatorId").asInt()
                : null;
        String rawIndicatorCode = result.path("indicatorCode").asText("").trim().toUpperCase();
        if (rawIndicatorId == null && !rawIndicatorCode.isBlank()) {
            rawIndicatorId = metricMapper.findIndicatorIdByCode(rawIndicatorCode);
        }
        if (rawIndicatorCode.isBlank() && rawIndicatorId != null) {
            rawIndicatorCode = metricMapper.findIndicatorCodeById(rawIndicatorId);
        }
        if (rawIndicatorCode == null) {
            rawIndicatorCode = "";
        }

        BigDecimal shipment = firstNonNull(signals.shipmentAmountMillionKrw(), aiShipment);
        BigDecimal electricity = firstNonNull(signals.electricityUsageKwh(), aiElectricity);
        Integer indicatorId = rawIndicatorId;
        String indicatorCode = rawIndicatorCode;
        String correctionReason = null;

        if (signals.scope2Document()) {
            Integer scope2IndicatorId = metricMapper.findIndicatorIdByCode(SCOPE2_INDICATOR_CODE);
            if (scope2IndicatorId == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "Scope 2 온실가스 배출량 지표를 찾을 수 없습니다.");
            }
            indicatorId = scope2IndicatorId;
            indicatorCode = SCOPE2_INDICATOR_CODE;
            category = "ENVIRONMENT";
            genericValue = firstNonNull(signals.scope2Value(), firstNonNull(aiScope2, genericValue));
            electricity = null;
            if (!SCOPE2_INDICATOR_CODE.equals(rawIndicatorCode)) {
                correctionReason = "SCOPE2_KEYWORD_AND_EMISSION_UNIT";
            }
        } else if (isPositive(signals.electricityUsageKwh())
                || ELECTRICITY_INDICATOR_CODE.equals(rawIndicatorCode)) {
            Integer electricityIndicatorId = metricMapper.findIndicatorIdByCode(ELECTRICITY_INDICATOR_CODE);
            indicatorId = electricityIndicatorId;
            indicatorCode = ELECTRICITY_INDICATOR_CODE;
            category = "ENVIRONMENT";
            genericValue = electricity;
        } else {
            if (category.isBlank()) {
                category = rawIndicatorCode.startsWith("IND_S_")
                        ? "SOCIAL"
                        : rawIndicatorCode.startsWith("IND_G_") ? "GOVERNANCE" : "ENVIRONMENT";
            }
            if (indicatorId == null && "GOVERNANCE".equals(category)) {
                indicatorId = metricMapper.findIndicatorIdByCode(GOVERNANCE_ATTENDANCE_CODE);
                indicatorCode = GOVERNANCE_ATTENDANCE_CODE;
            }
            if (GOVERNANCE_ATTENDANCE_CODE.equals(indicatorCode) && genericValue == null) {
                genericValue = rate;
            }
        }

        LocalDate aiDate = parseDate(result.path("date").asText());
        LocalDate documentDate = signals.documentDate() == null ? aiDate : signals.documentDate();
        int reportingYear = signals.reportingYear() == null
                ? result.path("reportingYear").asInt(aiDate.getYear())
                : signals.reportingYear();
        int periodValue = signals.reportingMonth() == null
                ? result.path("periodValue").asInt(aiDate.getMonthValue())
                : signals.reportingMonth();
        String summary = result.path("textValue")
                .asText(result.path("aiExplanation").asText("문서 내용 검토 필요."));
        String unit = signals.scope2Document()
                ? "tCO2eq"
                : result.path("unit").asText("");

        log.info("[DOCUMENT_AI] AI 응답 category={} indicatorId={} indicatorCode={} year={} month={} value={} "
                        + "unit={} scope2={} electricityKwh={} shipmentMillionKrw={} confidence={}",
                result.path("detectedCategory").asText(""),
                rawIndicatorId,
                rawIndicatorCode,
                result.path("reportingYear").asText(""),
                result.path("periodValue").asText(""),
                parseNullableDecimal(result.path("value")),
                result.path("unit").asText(""),
                aiScope2,
                aiElectricity,
                aiShipment,
                result.path("confidence").asText(""));

        if (correctionReason != null) {
            log.info("[DOCUMENT_AI] 지표 보정 reason={} aiIndicatorCode={} finalIndicatorCode={} finalValue={} unit={}",
                    correctionReason, rawIndicatorCode, indicatorCode, genericValue, unit);
        }

        return baseResponse(extension, fileUrl)
                .detectedCategory(category)
                .indicatorId(indicatorId)
                .reportingYear(reportingYear)
                .periodValue(clampMonth(periodValue))
                .value(genericValue)
                .textValue(summary)
                .type(signals.scope2Document()
                        ? "Scope 2 온실가스 배출량 보고서"
                        : result.path("type").asText(extension.toUpperCase() + " ESG 증빙문서"))
                .date(documentDate.toString())
                .total(total)
                .attended(attended)
                .rate(rate)
                .electricityUsageKwh(electricity)
                .shipmentAmountMillionKrw(shipment)
                .shipmentUnit("백만원")
                .agenda(result.path("agenda").asText(""))
                .aiExplanation(summary)
                .confidence(parseDecimal(result.path("confidence").asText(), BigDecimal.valueOf(90)))
                .build();
    }

    private DocumentAnalysisResponse createLocalFallback(
            String text,
            String extension,
            String fileUrl,
            DocumentSignals signals) {
        int total = matchInt(TOTAL_PATTERN, text);
        int attended = matchInt(ATTENDED_PATTERN, text);
        if (total > 0 && attended > total) {
            attended = total;
        }

        BigDecimal rate = calculateRate(total, attended);
        boolean scope2Document = signals.scope2Document();
        boolean electricityDocument = !scope2Document && isPositive(signals.electricityUsageKwh());
        String indicatorCode = scope2Document
                ? SCOPE2_INDICATOR_CODE
                : electricityDocument ? ELECTRICITY_INDICATOR_CODE : GOVERNANCE_ATTENDANCE_CODE;
        Integer indicatorId = metricMapper.findIndicatorIdByCode(indicatorCode);
        LocalDate documentDate = signals.documentDate() == null ? parseDate(matchDate(text)) : signals.documentDate();
        int reportingYear = signals.reportingYear() == null ? documentDate.getYear() : signals.reportingYear();
        int reportingMonth = signals.reportingMonth() == null ? documentDate.getMonthValue() : signals.reportingMonth();

        String explanation;
        BigDecimal value;
        String unit;
        String category;
        if (scope2Document) {
            explanation = "문서에서 Scope 2 온실가스 배출량과 보고 기간을 로컬 규칙으로 추출했습니다. "
                    + "배출량은 tCO2eq, 출하액은 백만원 기준으로 변환했습니다. "
                    + "등록 전 담당자가 원문과 추출값을 확인해 주세요.";
            value = signals.scope2Value();
            unit = "tCO2eq";
            category = "ENVIRONMENT";
        } else if (electricityDocument) {
            explanation = "문서에서 전력 사용량과 출하액 후보값을 로컬 규칙으로 추출했습니다. "
                    + "전력은 kWh, 출하액은 백만원으로 변환했습니다. "
                    + "등록 전 담당자가 원문과 추출값을 확인해 주세요.";
            value = signals.electricityUsageKwh();
            unit = "kWh";
            category = "ENVIRONMENT";
        } else {
            explanation = "문서에서 날짜, 참석 인원 및 핵심 내용을 로컬 규칙으로 추출했습니다. "
                    + "AI 연결이 복구되면 전체 지표 자동 매핑과 문맥 분석이 적용됩니다. "
                    + "등록 전 담당자가 지표와 수치를 확인해 주세요.";
            value = rate;
            unit = "%";
            category = "GOVERNANCE";
        }

        log.info("[DOCUMENT_AI] 로컬 fallback 결과 category={} indicatorCode={} year={} month={} value={} unit={} "
                        + "electricityKwh={} shipmentMillionKrw={}",
                category,
                indicatorCode,
                reportingYear,
                reportingMonth,
                value,
                unit,
                scope2Document ? null : signals.electricityUsageKwh(),
                signals.shipmentAmountMillionKrw());

        return baseResponse(extension, fileUrl)
                .detectedCategory(category)
                .indicatorId(indicatorId)
                .reportingYear(reportingYear)
                .periodValue(clampMonth(reportingMonth))
                .date(documentDate.toString())
                .total(total)
                .attended(attended)
                .rate(rate)
                .value(value)
                .electricityUsageKwh(scope2Document ? null : signals.electricityUsageKwh())
                .shipmentAmountMillionKrw(signals.shipmentAmountMillionKrw())
                .shipmentUnit("백만원")
                .agenda(firstMeaningfulLine(text))
                .textValue(explanation)
                .aiExplanation(explanation)
                .confidence(BigDecimal.valueOf(scope2Document ? 94 : electricityDocument ? 82 : (total > 0 ? 78 : 50)))
                .build();
    }

    private DocumentAnalysisResponse.DocumentAnalysisResponseBuilder baseResponse(String extension, String fileUrl) {
        return DocumentAnalysisResponse.builder()
                .type(extension.toUpperCase() + " ESG 증빙문서")
                .reportingYear(LocalDate.now().getYear())
                .periodType("MONTHLY")
                .periodValue(LocalDate.now().getMonthValue())
                .fileUrl(fileUrl)
                .submitForApproval(false);
    }

    private String buildIndicatorContext(List<IndicatorResponse> indicators) {
        if (indicators == null || indicators.isEmpty()) {
            return "등록된 활성 ESG 지표가 없습니다.";
        }
        StringBuilder context = new StringBuilder();
        for (IndicatorResponse indicator : indicators) {
            context.append("- 지표ID [")
                    .append(indicator.id())
                    .append("]: [")
                    .append(indicator.category() == null ? "" : indicator.category().name())
                    .append("] ")
                    .append(indicator.title())
                    .append(" (")
                    .append(indicator.unit())
                    .append(") 코드=")
                    .append(indicator.indicatorCode())
                    .append('\n');
        }
        return context.toString();
    }


    private boolean isCompanyWideGovernance(String indicatorCode) {
        return "IND_G_ATTENDANCE".equals(indicatorCode)
                || "IND_G_OUTSIDE".equals(indicatorCode);
    }

    private String originalEvidenceFilename(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return null;
        }
        String savedName = fileUrl.replace('\\', '/');
        int slash = savedName.lastIndexOf('/');
        if (slash >= 0) {
            savedName = savedName.substring(slash + 1);
        }
        int separator = savedName.indexOf('_');
        return separator > 30 && separator < savedName.length() - 1
                ? savedName.substring(separator + 1)
                : savedName;
    }

    private Long evidenceFileSize(Path path) {
        try {
            return Files.size(path);
        } catch (Exception exception) {
            log.warn("[DOCUMENT_AI] 증빙 파일 크기 확인 실패 reason={}", exception.getClass().getSimpleName());
            return null;
        }
    }

    private OffsetDateTime evidenceUploadedAt(Path path) {
        try {
            return OffsetDateTime.ofInstant(Files.getLastModifiedTime(path).toInstant(), ZoneOffset.UTC);
        } catch (Exception exception) {
            log.warn("[DOCUMENT_AI] 증빙 업로드 시각 확인 실패 reason={}", exception.getClass().getSimpleName());
            return null;
        }
    }

    private Path resolveUploadedFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "분석할 파일 경로가 필요합니다.");
        }
        String normalized = fileUrl.replace('\\', '/');
        String savedFileName = normalized.substring(normalized.lastIndexOf('/') + 1);
        if (savedFileName.isBlank() || savedFileName.contains("..")) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바르지 않은 파일 경로입니다.");
        }
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path file = root.resolve(savedFileName).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND, "분석할 파일을 찾을 수 없습니다.");
        }
        return file;
    }

    private String extractText(Path file, String extension) {
        try {
            return switch (extension) {
                case "pdf" -> extractPdf(file);
                case "xls", "xlsx" -> extractSpreadsheet(file);
                case "docx" -> extractWord(file);
                case "txt", "csv" -> Files.readString(file);
                default -> throw new BusinessException(
                        ErrorCode.INVALID_ESG_FILE,
                        "PDF, Excel, Word, TXT, CSV 파일만 분석할 수 있습니다.");
            };
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "문서 내용을 읽지 못했습니다.");
        }
    }

    private String extractPdf(Path file) throws Exception {
        try (PDDocument document = Loader.loadPDF(file.toFile())) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String extractSpreadsheet(Path file) throws Exception {
        DataFormatter formatter = new DataFormatter();
        StringBuilder result = new StringBuilder();
        try (FileInputStream input = new FileInputStream(file.toFile());
             Workbook workbook = WorkbookFactory.create(input)) {
            for (Sheet sheet : workbook) {
                result.append("[Sheet: ").append(sheet.getSheetName()).append("]\n");
                for (Row row : sheet) {
                    for (Cell cell : row) {
                        result.append(formatter.formatCellValue(cell)).append('\t');
                    }
                    result.append('\n');
                }
            }
        }
        return result.toString();
    }

    private String extractWord(Path file) throws Exception {
        try (FileInputStream input = new FileInputStream(file.toFile());
             XWPFDocument document = new XWPFDocument(input);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extensionOf(String fileName) {
        int position = fileName.lastIndexOf('.');
        return position < 0 ? "" : fileName.substring(position + 1).toLowerCase();
    }

    private DocumentSignals analyzeDocumentSignals(String text) {
        BigDecimal scope2Value = matchScope2Tco2eq(text);
        boolean scope2Document = scope2Value != null || SCOPE2_KEYWORD_PATTERN.matcher(text).find();
        BigDecimal electricity = scope2Document ? null : matchElectricityKwh(text);
        BigDecimal shipment = matchShipmentMillionKrw(text);
        LocalDate documentDate = matchDocumentDate(text);
        int[] reportingPeriod = matchReportingPeriod(text);
        return new DocumentSignals(
                scope2Document,
                scope2Value,
                electricity,
                shipment,
                documentDate,
                reportingPeriod == null ? null : reportingPeriod[0],
                reportingPeriod == null ? null : reportingPeriod[1]);
    }

    private BigDecimal matchScope2Tco2eq(String text) {
        Matcher matcher = SCOPE2_VALUE_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return decimalWithComma(matcher.group(1));
    }

    private LocalDate matchDocumentDate(String text) {
        Matcher matcher = DOCUMENT_DATE_PATTERN.matcher(text);
        if (matcher.find()) {
            return LocalDate.of(
                    Integer.parseInt(matcher.group(1)),
                    Integer.parseInt(matcher.group(2)),
                    Integer.parseInt(matcher.group(3)));
        }
        return parseDate(matchDate(text));
    }

    private int[] matchReportingPeriod(String text) {
        Matcher matcher = REPORTING_PERIOD_PATTERN.matcher(text);
        if (matcher.find()) {
            return new int[] {
                    Integer.parseInt(matcher.group(1)),
                    Integer.parseInt(matcher.group(2))
            };
        }

        Matcher scope2Header = Pattern.compile(
                "(20\\d{2})\\s*년\\s*(0?[1-9]|1[0-2])\\s*월[^\\n]{0,80}(?:scope\\s*2|온실가스\\s*배출량)",
                Pattern.CASE_INSENSITIVE).matcher(text);
        if (scope2Header.find()) {
            return new int[] {
                    Integer.parseInt(scope2Header.group(1)),
                    Integer.parseInt(scope2Header.group(2))
            };
        }
        return null;
    }

    private String matchDate(String text) {
        Matcher matcher = DATE_PATTERN.matcher(text);
        if (!matcher.find()) {
            return LocalDate.now().toString();
        }
        return String.format("%s-%02d-%02d",
                matcher.group(1),
                Integer.parseInt(matcher.group(2)),
                Integer.parseInt(matcher.group(3)));
    }

    private int matchInt(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : 0;
    }

    private BigDecimal calculateRate(int total, int attended) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(attended)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP);
    }

    private BigDecimal parseDecimal(String value, BigDecimal fallback) {
        try {
            return new BigDecimal(value);
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    private String firstMeaningfulLine(String text) {
        return text.lines()
                .map(String::trim)
                .filter(line -> line.length() >= 4)
                .findFirst()
                .map(line -> truncate(line, 120))
                .orElse("ESG 증빙자료 검토");
    }

    private BigDecimal matchElectricityKwh(String text) {
        Matcher matcher = ELECTRICITY_PATTERN.matcher(text);
        if (!matcher.find()) {
            if (!ELECTRICITY_KEYWORD_PATTERN.matcher(text).find()) {
                return null;
            }
            matcher = MEASURED_ELECTRICITY_PATTERN.matcher(text);
            if (!matcher.find()) {
                return null;
            }
        }
        BigDecimal value = decimalWithComma(matcher.group(1));
        String unit = matcher.group(2).toLowerCase();
        if (unit.equals("mwh") || unit.equals("천kwh")) {
            return value.multiply(BigDecimal.valueOf(1000));
        }
        return value;
    }

    private BigDecimal matchShipmentMillionKrw(String text) {
        Matcher matcher = SHIPMENT_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        BigDecimal value = decimalWithComma(matcher.group(1));
        return switch (matcher.group(2)) {
            case "억원" -> value.multiply(BigDecimal.valueOf(100));
            case "백만원" -> value;
            case "천원" -> value.divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
            case "원" -> value.divide(BigDecimal.valueOf(1_000_000), 2, RoundingMode.HALF_UP);
            default -> value;
        };
    }

    private BigDecimal decimalWithComma(String value) {
        return new BigDecimal(value.replace(",", ""));
    }

    private BigDecimal parseNullableDecimal(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull() || node.asText().isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(node.asText().replace(",", ""));
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private boolean isPositive(BigDecimal value) {
        return value != null && value.signum() > 0;
    }

    private BigDecimal firstNonNull(BigDecimal primary, BigDecimal fallback) {
        return primary != null ? primary : fallback;
    }

    private String buildEnvironmentFinalText(
            DocumentAnalysisResponse request,
            BigDecimal electricity,
            BigDecimal shipment) {
        String explanation = firstNonBlank(request.getTextValue(), request.getAiExplanation());
        return "문서일자: " + (request.getDate() == null ? "-" : request.getDate())
                + "\n전력 사용량: " + electricity.stripTrailingZeros().toPlainString() + " kWh"
                + "\n출하액: " + shipment.stripTrailingZeros().toPlainString() + " 백만원"
                + "\n분석 요약: " + explanation;
    }

    private String buildGenericFinalText(DocumentAnalysisResponse request) {
        String explanation = firstNonBlank(request.getTextValue(), request.getAiExplanation());
        if (request.getAgenda() != null && !request.getAgenda().isBlank()) {
            explanation = explanation + "\n핵심 안건: " + request.getAgenda().trim();
        }
        return explanation;
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }
        return second == null ? "" : second.trim();
    }

    private LocalDate parseDate(String value) {
        try {
            return value == null || value.isBlank() ? LocalDate.now() : LocalDate.parse(value);
        } catch (RuntimeException exception) {
            return LocalDate.now();
        }
    }

    private int clampMonth(int month) {
        return Math.max(1, Math.min(12, month));
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private String maskFileUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return "-";
        }
        String normalized = fileUrl.replace('\\', '/');
        return normalized.substring(normalized.lastIndexOf('/') + 1);
    }
}