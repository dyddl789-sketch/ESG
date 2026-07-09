package com.esg.platform.global.response;

import java.time.OffsetDateTime;

public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error,
        OffsetDateTime timestamp
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, OffsetDateTime.now());
    }

    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, null, null, OffsetDateTime.now());
    }

    public static ApiResponse<Void> error(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message), OffsetDateTime.now());
    }

    public record ApiError(String code, String message) {
    }
}
