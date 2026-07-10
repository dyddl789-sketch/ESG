package com.esg.platform.domain.useradmin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class UserAdminDto {
    private Long id;

    @JsonProperty("company_id")
    private Long companyId;

    @JsonProperty("department_id")
    private Long departmentId;

    @JsonProperty("department_name")
    private String departmentName;

    @JsonProperty("login_id")
    private String loginId;

    private String email;
    private String name;
    private String role;

    @JsonProperty("phone_number")
    private String phoneNumber;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("last_login_at")
    private OffsetDateTime lastLoginAt;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;
}