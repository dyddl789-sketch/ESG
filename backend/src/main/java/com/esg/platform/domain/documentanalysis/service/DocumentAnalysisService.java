package com.esg.platform.domain.documentanalysis.service;

import java.io.FileInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
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
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.domain.metric.service.MetricService;
import com.esg.platform.domain.metric.service.MetricWorkflowService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentAnalysisService {

    private static final Pattern DATE_PATTERN = Pattern.compile("(20\\d{2})[.\\-/년\\s]+(0?[1-9]|1[0-2])[.\\-/월\\s]+(0?[1-9]|[12]\\d|3[01])");
    private static final Pattern TOTAL_PATTERN = Pattern.compile("(?:전체|총)\\s*(?:이사)?\\s*(\\d+)\\s*명");
    private static final Pattern ATTENDED_PATTERN = Pattern.compile("(?:참석|출석)\\s*(?:이사)?\\s*(\\d+)\\s*명");

    private final MetricMapper metricMapper;
    private final MetricService metricService;
    private final MetricWorkflowService workflowService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.api.model:gpt-4o-mini}")
    private String model;

    public DocumentAnalysisResponse generateAiHelperData(String fileUrl) {
        Path uploadedFile = resolveUploadedFile(fileUrl);
        String extension = extensionOf(uploadedFile.getFileName().toString());
        String extractedText = extractText(uploadedFile, extension);
        if (extractedText.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "문서에서 분석 가능한 텍스트를 찾지 못했습니다.");
        }

        DocumentAnalysisResponse result = apiKey == null || apiKey.isBlank()
                ? createLocalFallback(extractedText, extension, fileUrl)
                : callOpenAi(extractedText, extension, fileUrl);
        log.info("[DOCUMENT_AI] 문서 분석 완료 file={} extension={} confidence={}",
                uploadedFile.getFileName(), extension, result.getConfidence());
        return result;
    }

    @Transactional
    public Long processUserFinalSubmission(
            DocumentAnalysisResponse request,
            Integer companyId,
            Integer inputUserId) {
        if (request == null || request.getRate() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "최종 등록할 ESG 수치가 필요합니다.");
        }

        Integer indicatorId = request.getIndicatorId();
        if (indicatorId == null) {
            indicatorId = metricMapper.findIndicatorIdByCode("IND_G_ATTENDANCE");
        }
        if (indicatorId == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "이사회 참석률 지표를 찾을 수 없습니다.");
        }

        Integer facilityId = request.getFacilityId();
        if (facilityId == null) {
            facilityId = metricMapper.findHeadquartersFacilityId(companyId.longValue());
        }

        int year = request.getReportingYear() == null ? LocalDate.now().getYear() : request.getReportingYear();
        int periodValue = request.getPeriodValue() == null ? 1 : request.getPeriodValue();
        String periodType = request.getPeriodType() == null || request.getPeriodType().isBlank()
                ? "MONTHLY"
                : request.getPeriodType();
        String text = buildFinalText(request);

        MetricCreateRequest metricRequest = new MetricCreateRequest(
                indicatorId,
                facilityId,
                year,
                periodType,
                periodValue,
                request.getRate(),
                text,
                request.getFileUrl(),
                false);
        Long metricId = metricService.createMetric(metricRequest, companyId, inputUserId);
        if (Boolean.TRUE.equals(request.getSubmitForApproval())) {
            workflowService.requestApproval(metricId, inputUserId.longValue());
        }
        log.info("[DOCUMENT_AI] 분석 결과 ESG 등록 metricId={} companyId={} userId={} submit={}",
                metricId, companyId, inputUserId, Boolean.TRUE.equals(request.getSubmitForApproval()));
        return metricId;
    }

    private DocumentAnalysisResponse callOpenAi(String text, String extension, String fileUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String systemPrompt = "대한민국 ESG 증빙문서 감사 보조자다. 제공 문서에서 이사회 또는 ESG 핵심 수치를 추출하고 JSON만 반환한다. "
                    + "형식: {\"date\":\"YYYY-MM-DD\",\"total\":정수,\"attended\":정수,\"rate\":숫자,"
                    + "\"agenda\":\"핵심 안건\",\"aiExplanation\":\"한글 3문장 요약\",\"confidence\":0~100}.";

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
            return responseFromJson(result, extension, fileUrl);
        } catch (Exception exception) {
            log.warn("[DOCUMENT_AI] OpenAI 호출 실패, 로컬 추출 결과로 대체 reason={}", exception.getMessage());
            return createLocalFallback(text, extension, fileUrl);
        }
    }

    private DocumentAnalysisResponse responseFromJson(JsonNode result, String extension, String fileUrl) {
        int total = Math.max(result.path("total").asInt(0), 0);
        int attended = Math.max(result.path("attended").asInt(0), 0);
        BigDecimal rate = parseDecimal(result.path("rate").asText(), calculateRate(total, attended));
        return baseResponse(extension, fileUrl)
                .date(result.path("date").asText(LocalDate.now().toString()))
                .total(total)
                .attended(attended)
                .rate(rate)
                .confidence(parseDecimal(result.path("confidence").asText(), BigDecimal.valueOf(90)))
                .agenda(result.path("agenda").asText("ESG 증빙자료 검토"))
                .aiExplanation(result.path("aiExplanation").asText("문서에서 ESG 핵심 항목을 추출했습니다. 담당자의 최종 검토가 필요합니다."))
                .build();
    }

    private DocumentAnalysisResponse createLocalFallback(String text, String extension, String fileUrl) {
        String date = matchDate(text);
        int total = matchInt(TOTAL_PATTERN, text);
        int attended = matchInt(ATTENDED_PATTERN, text);
        if (total > 0 && attended > total) {
            attended = total;
        }
        BigDecimal rate = calculateRate(total, attended);
        String agenda = firstMeaningfulLine(text);
        String explanation = "문서에서 날짜, 인원 및 핵심 안건을 로컬 규칙으로 추출했습니다. "
                + "OpenAI 키가 설정되면 문맥 기반 AI 요약이 추가됩니다. "
                + "등록 전 담당자가 추출값과 증빙 원문을 반드시 확인해 주세요.";
        return baseResponse(extension, fileUrl)
                .date(date)
                .total(total)
                .attended(attended)
                .rate(rate)
                .confidence(BigDecimal.valueOf(total > 0 ? 78 : 55))
                .agenda(agenda)
                .aiExplanation(explanation)
                .build();
    }

    private DocumentAnalysisResponse.DocumentAnalysisResponseBuilder baseResponse(String extension, String fileUrl) {
        return DocumentAnalysisResponse.builder()
                .type(extension.toUpperCase() + " ESG 증빙문서")
                .indicatorId(metricMapper.findIndicatorIdByCode("IND_G_ATTENDANCE"))
                .reportingYear(LocalDate.now().getYear())
                .periodType("MONTHLY")
                .periodValue(LocalDate.now().getMonthValue())
                .fileUrl(fileUrl)
                .submitForApproval(false);
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

    private String buildFinalText(DocumentAnalysisResponse request) {
        String explanation = request.getAiExplanation() == null ? "" : request.getAiExplanation().trim();
        String agenda = request.getAgenda() == null ? "" : request.getAgenda().trim();
        return "문서일자: " + (request.getDate() == null ? "-" : request.getDate())
                + "\n핵심 안건: " + agenda
                + "\n분석 요약: " + explanation;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
