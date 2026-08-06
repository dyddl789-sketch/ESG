package com.esg.platform.domain.dashboard.controller;

import java.time.Year;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.dashboard.dto.DashboardSummaryDto;
import com.esg.platform.domain.member.entity.UserRole;
import com.esg.platform.domain.dashboard.service.DashboardService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryDto> getSummary(
            @RequestParam(name = "year", required = false) Integer year,
            @RequestParam(name = "month", required = false) Integer month,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        int resolvedYear = year == null ? Year.now().getValue() : year;
        Integer resolvedMonth = month != null && month >= 1 && month <= 12 ? month : null;
        boolean publishedOnly = principal != null
                && principal.getUser() != null
                && principal.getUser().getRole() == UserRole.EXTERNAL_USER;
        return ApiResponse.ok(dashboardService.getSummary(
                resolvedYear,
                resolvedMonth,
                facilityId,
                publishedOnly));
    }
}
