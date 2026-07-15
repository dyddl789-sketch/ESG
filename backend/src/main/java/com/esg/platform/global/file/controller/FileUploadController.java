package com.esg.platform.global.file.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 💡 운영체제별 루트 권한 거부 버그를 방어하기 위해 
     * 프로그래밍 방식으로 안전한 가상 물리 경로를 동적 계산하여 반환합니다.
     */
    private Path getSafeUploadPath() throws IOException {
        String cleanDir = uploadDir;
        
        // 윈도우 로컬 개발 환경(인텔리제이)일 경우, C드라이브 루트 차단 에러를 막기 위해
        // 무조건 현재 실행 중인 프로젝트 루트 폴더 하위의 상대 경로 구조로 강제 고정 전개합니다.
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            cleanDir = cleanDir.replace("C:", "").replace("\\", "/");
            if (cleanDir.startsWith("/")) {
                cleanDir = cleanDir.substring(1);
            }
            Path winPath = Paths.get(System.getProperty("user.dir")).resolve(cleanDir).normalize();
            if (!Files.exists(winPath)) {
                Files.createDirectories(winPath);
                System.out.println("📁 [윈도우 인프라 복구] 프로젝트 하위 자동 생성 완료: " + winPath);
            }
            return winPath;
        }

        // 리눅스/도커 배포 환경일 경우의 기존 정석 절대 경로 로직 유지
        Path linuxPath = Paths.get(cleanDir).normalize();
        if (!Files.exists(linuxPath)) {
            Files.createDirectories(linuxPath);
        }
        return linuxPath;
    }

    /**
     * 1. 파일 업로드 API (NIO 스트림 기반 500 에러 완치본)
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 존재하지 않습니다.");
        }

        // 💡 [500 에러 완치 핵심] Windows 톰캣 임시파일 경로 충돌을 방지하기 위해 
        // transferTo를 쓰지 않고 순수 바이트 입출력 스트림을 직접 열어 지정된 폴더에 강제로 덮어씁니다.
        try (InputStream inputStream = file.getInputStream()) {
            Path targetDirectoryPath = getSafeUploadPath();

            String originalFileName = file.getOriginalFilename();
            if (originalFileName == null) {
                originalFileName = "unnamed_file";
            }
            
            // 공백이나 특수문자로 인한 파일명 뒤틀림 방지
            originalFileName = originalFileName.replaceAll("[\\s\\\\/:*?\"<>|]", "_");

            // UUID 명세 엄격 보존
            String savedFileName = UUID.randomUUID().toString() + "_" + originalFileName;
            Path targetFilePath = targetDirectoryPath.resolve(savedFileName).normalize();

            // 💡 파일 스트림을 타겟 경로로 직접 복사 (기존 파일이 혹시 있으면 REPLACE 덮어쓰기 안전망 장착)
            Files.copy(inputStream, targetFilePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/evidence/" + savedFileName;
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl));

        } catch (IOException e) {
            System.err.println("❌ [물리 디스크 에러 상세 내역]: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "서버 내부 디스크 파일 저장 중 물리 오류 발생: " + e.getMessage()));
        }
    }

    /**
     * 2. 파일 다운로드 API
     */
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam(name = "fileUrl") String fileUrl) {
        try {
            String savedFileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            
            Path targetDirectoryPath = getSafeUploadPath();
            Path filePath = targetDirectoryPath.resolve(savedFileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new IllegalArgumentException("요청하신 증빙 파일이 서버에 존재하지 않습니다.");
            }

            String originalFileName = savedFileName;
            if (savedFileName.contains("_") && savedFileName.indexOf("_") > 30) {
                originalFileName = savedFileName.substring(savedFileName.indexOf("_") + 1);
            }

            String encodedFileName = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("파일 다운로드 중 서버 오류가 발생했습니다.", e);
        }
    }
}
