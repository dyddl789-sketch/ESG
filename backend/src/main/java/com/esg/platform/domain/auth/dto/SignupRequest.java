package com.esg.platform.domain.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "로그인 아이디를 입력해 주세요.")
        @Pattern(
                regexp = "^[A-Za-z][A-Za-z0-9_]{3,19}$",
                message = "로그인 아이디는 영문으로 시작하는 4~20자의 영문, 숫자, 밑줄만 사용할 수 있습니다."
        )
        String loginId,

        @NotBlank(message = "이름을 입력해 주세요.")
        @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
        String name,

        @NotBlank(message = "이메일을 입력해 주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        @Size(max = 255, message = "이메일은 255자 이하여야 합니다.")
        String email,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 8, max = 64, message = "비밀번호는 8자 이상 64자 이하여야 합니다.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,64}$",
                message = "비밀번호는 영문, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다."
        )
        String password,

        @NotBlank(message = "비밀번호 확인을 입력해 주세요.")
        String passwordConfirm,

        @NotBlank(message = "휴대폰 번호를 입력해 주세요.")
        @Pattern(
                regexp = "^01[016789]-?\\d{3,4}-?\\d{4}$",
                message = "휴대폰 번호 형식을 확인해 주세요."
        )
        String phoneNumber,

        @AssertTrue(message = "서비스 이용약관과 개인정보 처리방침에 동의해야 합니다.")
        boolean termsAccepted
) {
    @AssertTrue(message = "비밀번호와 비밀번호 확인이 일치하지 않습니다.")
    public boolean isPasswordMatched() {
        return password != null && password.equals(passwordConfirm);
    }
}
