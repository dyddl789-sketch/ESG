package com.esg.platform.domain.member.dto;

import com.esg.platform.domain.member.entity.User;
import com.esg.platform.domain.member.entity.UserRole;

public record UserResponse(
        Long id,
        String email,
        String name,
        UserRole role,
        Long companyId,
        Long departmentId,
        String profileImageUrl,
        String socialProvider
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getCompanyId(),
                user.getDepartmentId(),
                user.getProfileImageUrl(),
                user.getSocialProvider() == null ? null : user.getSocialProvider().name()
        );
    }
}
