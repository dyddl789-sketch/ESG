package com.esg.platform.domain.member.entity;

import java.time.OffsetDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private Long companyId;
    private Long departmentId;
    private String loginId;
    private String email;
    private String passwordHash;
    private String name;
    private UserRole role;
    private String phoneNumber;
    private SocialProvider socialProvider;
    private String socialId;
    private String profileImageUrl;
    private boolean emailVerified;
    private OffsetDateTime emailVerifiedAt;
    private boolean active;
    private int tokenVersion;
    private OffsetDateTime lastLoginAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
