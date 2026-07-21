package com.esg.platform.global.file.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.esg.platform.domain.member.entity.UserRole;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.esg.platform.global.security.EsgUserPrincipal;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);
    private static final String PUBLIC_FILE_PREFIX = "/uploads/evidence/";
    private static final long MAX_FILE_SIZE = 20L * 1024L * 1024L;

    private final MetricMapper metricMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public FileUploadController(MetricMapper metricMapper) {
        this.metricMapper = metricMapper;
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('COMPANY_MANAGER', 'SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        validatePdf(file);

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String savedFileName = UUID.randomUUID() + "_" + originalFileName;
        Path uploadRoot = uploadRoot();
        Path targetPath = uploadRoot.resolve(savedFileName).normalize();
        ensureInsideUploadRoot(uploadRoot, targetPath);

        try {
            Files.createDirectories(uploadRoot);
            file.transferTo(targetPath);
            String fileUrl = PUBLIC_FILE_PREFIX + savedFileName;
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("originalFilename", originalFileName);
            response.put("contentType", MediaType.APPLICATION_PDF_VALUE);
            response.put("size", file.getSize());
            response.put("uploadedAt", OffsetDateTime.now(ZoneOffset.UTC));
            log.info("[FILE_UPLOAD] ESG 증빙 PDF 저장 savedFileName={} size={}", savedFileName, file.getSize());
            return ResponseEntity.ok(response);
        } catch (IOException exception) {
            log.error("[FILE_UPLOAD] 증빙 파일 저장 실패 savedFileName={}", savedFileName, exception);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "증빙 파일을 저장하지 못했습니다.");
        }
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ResponseEntity<Map<String, Object>> getFileStatus(
            @RequestParam(name = "fileUrl") String fileUrl,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        assertEvidenceAccess(fileUrl, principal);

        String savedFileName = extractSavedFileName(fileUrl);
        Path uploadRoot = uploadRoot();
        Path filePath = uploadRoot.resolve(savedFileName).normalize();
        ensureInsideUploadRoot(uploadRoot, filePath);

        boolean exists = Files.exists(filePath) && Files.isRegularFile(filePath) && Files.isReadable(filePath);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("fileUrl", fileUrl);
        response.put("exists", exists);
        response.put("originalFilename", restoreOriginalFileName(savedFileName));
        response.put("contentType", MediaType.APPLICATION_PDF_VALUE);

        if (exists) {
            try {
                response.put("size", Files.size(filePath));
                response.put("lastModifiedAt",
                        OffsetDateTime.ofInstant(Files.getLastModifiedTime(filePath).toInstant(), ZoneOffset.UTC));
            } catch (IOException exception) {
                log.warn("[FILE_STATUS] 증빙 메타정보 조회 실패 savedFileName={} reason={}",
                        savedFileName, exception.getClass().getSimpleName());
            }
        }

        log.debug("[FILE_STATUS] 증빙 상태 조회 savedFileName={} exists={}", savedFileName, exists);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam(name = "fileUrl") String fileUrl,
            @RequestParam(name = "inline", defaultValue = "false") boolean inline,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        assertEvidenceAccess(fileUrl, principal);

        String savedFileName = extractSavedFileName(fileUrl);
        Path uploadRoot = uploadRoot();
        Path filePath = uploadRoot.resolve(savedFileName).normalize();
        ensureInsideUploadRoot(uploadRoot, filePath);

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath) || !Files.isReadable(filePath)) {
            log.warn("[FILE_DOWNLOAD] 증빙 파일 없음 savedFileName={} resolvedPath={}", savedFileName, filePath);
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND, "요청하신 증빙 파일이 서버에 존재하지 않습니다.");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            String originalFileName = restoreOriginalFileName(savedFileName);
            String encodedFileName = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8).replace("+", "%20");
            String disposition = inline ? "inline" : "attachment";

            log.info("[FILE_DOWNLOAD] 증빙 PDF 응답 savedFileName={} inline={}", savedFileName, inline);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename*=UTF-8''" + encodedFileName)
                    .body(resource);
        } catch (IOException exception) {
            log.error("[FILE_DOWNLOAD] 증빙 파일 리소스 생성 실패 savedFileName={}", savedFileName, exception);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "파일 다운로드 중 서버 오류가 발생했습니다.");
        }
    }

    private void assertEvidenceAccess(String fileUrl, EsgUserPrincipal principal) {
        if (principal != null
                && principal.getUser().getRole() == UserRole.EXTERNAL_USER
                && metricMapper.countApprovedEvidenceByUrl(fileUrl) == 0) {
            log.warn("[FILE_ACCESS] 외부 사용자 비승인 증빙 접근 차단 userId={}",
                    principal.getUser().getId());
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "업로드할 PDF 파일을 선택해 주세요.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "증빙 PDF는 20MB 이하만 업로드할 수 있습니다.");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String contentType = file.getContentType();
        boolean pdfName = originalName.endsWith(".pdf");
        boolean pdfContent = MediaType.APPLICATION_PDF_VALUE.equalsIgnoreCase(contentType)
                || "application/octet-stream".equalsIgnoreCase(contentType);
        if (!pdfName || !pdfContent) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "ESG 증빙은 PDF 파일만 업로드할 수 있습니다.");
        }
    }

    private Path uploadRoot() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    private String sanitizeFileName(String originalFileName) {
        String value = originalFileName == null || originalFileName.isBlank()
                ? "evidence.pdf"
                : Paths.get(originalFileName).getFileName().toString();
        String sanitized = value.replaceAll("[\\s\\\\/:*?\"<>|]", "_");
        return sanitized.isBlank() ? "evidence.pdf" : sanitized;
    }

    private String extractSavedFileName(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "다운로드할 증빙 파일 경로가 필요합니다.");
        }
        String normalized = fileUrl.replace('\\', '/');
        int lastSlash = normalized.lastIndexOf('/');
        String savedFileName = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
        if (savedFileName.isBlank() || savedFileName.contains("..")) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바르지 않은 증빙 파일 경로입니다.");
        }
        return savedFileName;
    }

    private void ensureInsideUploadRoot(Path uploadRoot, Path candidate) {
        if (!candidate.startsWith(uploadRoot)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바르지 않은 증빙 파일 경로입니다.");
        }
    }

    private String restoreOriginalFileName(String savedFileName) {
        int separator = savedFileName.indexOf('_');
        return separator > 30 && separator < savedFileName.length() - 1
                ? savedFileName.substring(separator + 1)
                : savedFileName;
    }
}
