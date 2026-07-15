package com.esg.platform.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // application.yml에 등록해 둔 물리 저장 경로 주입
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        /**
         * /uploads/evidence/** 경로로 접근하는 파일 스트리밍 시
         * 브라우저가 파일의 원래 이름(Content-Disposition) 속성을 프론트엔드단에서 
         * 유연하게 컨트롤하고 캐시 충돌 없이 온전하게 다운로드할 수 있도록 헤더 설정을 추가합니다.
         */
        registry.addResourceHandler("/uploads/evidence/**")
                .addResourceLocations("file:" + uploadDir)
                .setCacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic()) // 정적 자원 성능 최적화
                .resourceChain(true); // 리소스 체인을 활성화하여 파일 메타데이터 흐름 보존
    }
}
