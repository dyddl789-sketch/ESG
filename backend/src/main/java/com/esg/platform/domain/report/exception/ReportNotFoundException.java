// 기능 요약: 리포트 템플릿이나 생성된 리포트를 데이터베이스에서 찾을 수 없을 때 발생하는 커스텀 예외 클래스입니다.
package com.esg.platform.domain.report.exception;

public class ReportNotFoundException extends RuntimeException {
    
    // 기능 설명: 예외 발생 시 메시지를 받아 부모 클래스인 RuntimeException에 전달하는 생성자입니다.
    public ReportNotFoundException(String message) {
        super(message);
        // 서버 콘솔에 예외 발생 메시지를 로깅하여 원인을 파악하기 쉽게 돕습니다.
        System.out.println("[ReportNotFoundException] 예외 발생: " + message);
    }
}