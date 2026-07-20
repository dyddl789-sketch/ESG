package com.esg.platform.global.file.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);
    private static final String PUBLIC_FILE_PREFIX = "/uploads/evidence/";

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('COMPANY_MANAGER', 'SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "업로드할 파일을 선택해 주세요.");
        }

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String savedFileName = UUID.randomUUID() + "_" + originalFileName;
        Path uploadRoot = uploadRoot();
        Path targetPath = uploadRoot.resolve(savedFileName).normalize();
        ensureInsideUploadRoot(uploadRoot, targetPath);

        try {
            Files.createDirectories(uploadRoot);
            file.transferTo(targetPath);
            String fileUrl = PUBLIC_FILE_PREFIX + savedFileName;
            log.info("[FILE_UPLOAD] 증빙 파일 저장 savedFileName={} size={} contentType={}",
                    savedFileName, file.getSize(), file.getContentType());
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl));
        } catch (IOException exception) {
            log.error("[FILE_UPLOAD] 증빙 파일 저장 실패 savedFileName={}", savedFileName, exception);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "증빙 파일을 저장하지 못했습니다.");
        }
    }

    @GetMapping("/download")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam(name = "fileUrl") String fileUrl,
            @RequestParam(name = "inline", defaultValue = "false") boolean inline) {
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
            String encodedFileName = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            String detectedContentType = Files.probeContentType(filePath);
            MediaType contentType = detectedContentType == null
                    ? MediaType.APPLICATION_OCTET_STREAM
                    : MediaType.parseMediaType(detectedContentType);
            String disposition = inline ? "inline" : "attachment";

            log.info("[FILE_DOWNLOAD] 증빙 파일 응답 savedFileName={} downloadName={} inline={}",
                    savedFileName, originalFileName, inline);
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            disposition + "; filename*=UTF-8''" + encodedFileName)
                    .body(resource);
        } catch (IOException exception) {
            log.error("[FILE_DOWNLOAD] 증빙 파일 리소스 생성 실패 savedFileName={}", savedFileName, exception);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "파일 다운로드 중 서버 오류가 발생했습니다.");
        }
    }

    private Path uploadRoot() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    private String sanitizeFileName(String originalFileName) {
        String value = originalFileName == null || originalFileName.isBlank()
                ? "unnamed_file"
                : Paths.get(originalFileName).getFileName().toString();
        String sanitized = value.replaceAll("[\\s\\\\/:*?\"<>|]", "_");
        return sanitized.isBlank() ? "unnamed_file" : sanitized;
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
