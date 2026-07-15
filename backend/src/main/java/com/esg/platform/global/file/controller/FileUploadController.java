package com.esg.platform.global.file.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 1. 파일 업로드 API (UUID와 원본 파일명을 언더바(_)로 결합하여 디스크 저장)
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 존재하지 않습니다.");
        }

        try {
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs(); 
            }

            String originalFileName = file.getOriginalFilename();
            if (originalFileName == null) {
                originalFileName = "unnamed_file";
            }
            
            // 공백이나 특수문자로 인한 쿼리 꼬임을 방지하기 위해 파일명 정돈
            originalFileName = originalFileName.replaceAll("[\\s\\\\/:*?\"<>|]", "_");

            // 💡 [핵심 고도화] 물리 파일 이름 충돌을 피하면서 원본명을 보존하기 위해 UUID_원본파일명 형태로 결합
            String savedFileName = UUID.randomUUID().toString() + "_" + originalFileName;

            File targetFile = new File(uploadDir + savedFileName);
            file.transferTo(targetFile);

            String fileUrl = "/uploads/evidence/" + savedFileName;
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl));

        } catch (IOException e) {
            throw new RuntimeException("서ver 내부 디스크 파일 저장 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 2. 파일 다운로드 API (앞의 UUID 영역을 칼같이 잘라내고 순수 원본명으로 복원)
     */
    @GetMapping("/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(
            @RequestParam(name = "fileUrl") String fileUrl) {
        try {
            // URL 경로에서 저장된 파일명 추출 (예: UUID_2026_전기요금.xls)
            String savedFileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir).resolve(savedFileName).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new IllegalArgumentException("요청하신 증빙 파일이 서버에 존재하지 않습니다.");
            }

            // 💡 [핵심 고도화] 파일 이름에 언더바(_)가 존재할 경우 앞의 UUID(36자) 영역을 통째로 잘라내고 순수 원본 파일명만 복원
            String originalFileName = savedFileName;
            if (savedFileName.contains("_") && savedFileName.indexOf("_") > 30) {
                originalFileName = savedFileName.substring(savedFileName.indexOf("_") + 1);
            }

            // 한글이나 공백이 깨지지 않도록 UTF-8 인코딩 처리
            String encodedFileName = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("파일 다운로드 중 서버 오류가 발생했습니다.", e);
        }
    }
}
