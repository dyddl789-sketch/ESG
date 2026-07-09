package com.esg.platform.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuthCodeExchangeRequest(
        @NotBlank(message = "소셜 로그인 인증 코드가 없습니다.")
        String code
) {
}
