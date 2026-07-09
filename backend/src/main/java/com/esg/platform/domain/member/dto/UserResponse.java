package com.esg.platform.domain.member.dto;

import com.esg.platform.domain.member.entity.User;
import com.esg.platform.domain.member.entity.UserRole;

public record UserResponse(
        Long id,
        String loginId,
        String email,
        String name,
        UserRole role,
        Long companyId,
        Long departmentId,
        String phoneNumber,
        boolean emailVerified,
        String profileImageUrl,
        String socialProvider
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getLoginId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getCompanyId(),
                user.getDepartmentId(),
                user.getPhoneNumber(),
                user.isEmailVerified(),
                user.getProfileImageUrl(),
                user.getSocialProvider() == null ? null : user.getSocialProvider().name()
        );
    }
}
