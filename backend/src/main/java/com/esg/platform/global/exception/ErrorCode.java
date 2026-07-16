package com.esg.platform.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "입력값을 확인해 주세요."),
    LOGIN_ID_ALREADY_EXISTS(HttpStatus.CONFLICT, "LOGIN_ID_ALREADY_EXISTS", "이미 사용 중인 로그인 아이디입니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "이미 사용 중인 이메일입니다."),
    PHONE_ALREADY_EXISTS(HttpStatus.CONFLICT, "PHONE_ALREADY_EXISTS", "이미 사용 중인 휴대폰 번호입니다."),
    EMAIL_NOT_VERIFIED(HttpStatus.BAD_REQUEST, "EMAIL_NOT_VERIFIED", "이메일 인증을 완료해 주세요."),
    EMAIL_VERIFICATION_EXPIRED(HttpStatus.BAD_REQUEST, "EMAIL_VERIFICATION_EXPIRED", "이메일 인증번호가 만료되었습니다. 다시 발송해 주세요."),
    EMAIL_VERIFICATION_CODE_INVALID(HttpStatus.BAD_REQUEST, "EMAIL_VERIFICATION_CODE_INVALID", "이메일 인증번호가 올바르지 않습니다."),
    EMAIL_VERIFICATION_TOO_FREQUENT(HttpStatus.TOO_MANY_REQUESTS, "EMAIL_VERIFICATION_TOO_FREQUENT", "인증번호를 이미 발송했습니다. 잠시 후 다시 시도해 주세요."),
    EMAIL_SEND_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_SEND_FAILED", "인증 이메일을 발송하지 못했습니다. 잠시 후 다시 시도해 주세요."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "로그인 아이디 또는 비밀번호가 올바르지 않습니다."),
    ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "비활성화된 계정입니다."),
    LOGIN_TEMPORARILY_BLOCKED(HttpStatus.TOO_MANY_REQUESTS, "LOGIN_TEMPORARILY_BLOCKED", "로그인 시도가 일시적으로 제한되었습니다. 잠시 후 다시 시도해 주세요."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "FORBIDDEN", "접근 권한이 없습니다."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "TOKEN_INVALID", "유효하지 않거나 만료된 인증 정보입니다."),
    REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_REUSED", "재사용되었거나 폐기된 로그인 정보입니다. 다시 로그인해 주세요."),
    OAUTH_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "OAUTH_LOGIN_FAILED", "카카오 로그인 처리에 실패했습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."),
    FACILITY_NOT_FOUND(HttpStatus.NOT_FOUND, "FACILITY_NOT_FOUND", "사업장을 찾을 수 없습니다."),
    ESG_METRIC_NOT_FOUND(HttpStatus.NOT_FOUND, "ESG_METRIC_NOT_FOUND", "ESG 지표 데이터를 찾을 수 없습니다."),
    AI_ANALYSIS_REQUIRED(HttpStatus.BAD_REQUEST, "AI_ANALYSIS_REQUIRED", "승인 요청 전에 AI 사전 분석을 완료해 주세요."),
    INVALID_WORKFLOW_STATUS(HttpStatus.CONFLICT, "INVALID_WORKFLOW_STATUS", "현재 상태에서는 해당 업무를 처리할 수 없습니다."),
    COLLECTION_ALREADY_RUNNING(HttpStatus.CONFLICT, "COLLECTION_ALREADY_RUNNING", "동일 영역의 수집 작업이 이미 실행 중입니다."),
    UNSUPPORTED_ESG_DOMAIN(HttpStatus.BAD_REQUEST, "UNSUPPORTED_ESG_DOMAIN", "지원하지 않는 ESG 영역입니다."),
    INVALID_ESG_FILE(HttpStatus.BAD_REQUEST, "INVALID_ESG_FILE", "업로드 파일을 확인해 주세요."),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "요청한 파일을 찾을 수 없습니다."),
    GEMINI_API_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "GEMINI_API_ERROR", "Gemini AI 분석을 처리하지 못했습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
