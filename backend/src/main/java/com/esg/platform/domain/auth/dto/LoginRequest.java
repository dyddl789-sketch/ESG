package com.esg.platform.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
        @NotBlank(message = "로그인 아이디를 입력해 주세요.")
        @Pattern(
                regexp = "^[A-Za-z][A-Za-z0-9_]{3,19}$",
                message = "로그인 아이디는 영문으로 시작하는 4~20자의 영문, 숫자, 밑줄만 사용할 수 있습니다."
        )
        String loginId,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        String password
) {
}
