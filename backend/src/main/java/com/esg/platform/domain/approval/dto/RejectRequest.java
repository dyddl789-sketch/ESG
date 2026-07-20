package com.esg.platform.domain.approval.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRequest(
        @NotBlank(message = "반려 사유를 입력해 주세요.")
        @Size(max = 500, message = "반려 사유는 500자 이하여야 합니다.")
        String reason
) {
}
