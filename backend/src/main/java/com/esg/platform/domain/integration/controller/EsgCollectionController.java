package com.esg.platform.domain.integration.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.integration.dto.CollectionRunDto;
import com.esg.platform.domain.integration.dto.EnvironmentMonthlyDto;
import com.esg.platform.domain.integration.dto.FacilityEsgDetailDto;
import com.esg.platform.domain.integration.dto.GovernancePeriodDto;
import com.esg.platform.domain.integration.dto.RawDataDto;
import com.esg.platform.domain.integration.dto.ReflectionResponse;
import com.esg.platform.domain.integration.dto.SocialMonthlyDto;
import com.esg.platform.domain.integration.service.EsgCollectionQueryService;
import com.esg.platform.domain.integration.service.EsgReflectionService;
import com.esg.platform.domain.member.entity.UserRole;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/esg")
@RequiredArgsConstructor
public class EsgCollectionController {

    private final EsgCollectionQueryService queryService;
    private final EsgReflectionService reflectionService;

    @GetMapping("/environment")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<List<EnvironmentMonthlyDto>> getEnvironment(
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "reflectionStatus", required = false) String reflectionStatus,
            @RequestParam(name = "approvalStatus", required = false) String approvalStatus,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(queryService.getEnvironment(
                period, facilityId, search, reflectionStatus, approvalStatus, isExternal(principal)));
    }

    @GetMapping("/social")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<List<SocialMonthlyDto>> getSocial(
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "reflectionStatus", required = false) String reflectionStatus,
            @RequestParam(name = "approvalStatus", required = false) String approvalStatus,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(queryService.getSocial(
                period, facilityId, search, reflectionStatus, approvalStatus, isExternal(principal)));
    }

    @GetMapping("/governance")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<List<GovernancePeriodDto>> getGovernance(
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "reflectionStatus", required = false) String reflectionStatus,
            @RequestParam(name = "approvalStatus", required = false) String approvalStatus,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(queryService.getGovernance(
                period, reflectionStatus, approvalStatus, isExternal(principal)));
    }

    @PostMapping("/{domain}/reflect")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ApiResponse<ReflectionResponse> reflect(
            @PathVariable(name = "domain") String domain,
            @RequestParam(name = "period") String period,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(reflectionService.reflect(
                domain,
                period,
                facilityId,
                principal.getUser().getId()));
    }

    @GetMapping("/facilities/{facilityId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<FacilityEsgDetailDto> getFacilityDetail(
            @PathVariable(name = "facilityId") Long facilityId,
            @RequestParam(name = "period", required = false) String period,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(queryService.getFacilityDetail(facilityId, period, isExternal(principal)));
    }

    @GetMapping("/raw-data")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ApiResponse<List<RawDataDto>> getRawData(
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "domain", required = false) String domain,
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "limit", required = false) Integer limit) {
        return ApiResponse.ok(queryService.getRawData(facilityId, domain, period, limit));
    }

    @GetMapping("/collection-runs")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ApiResponse<List<CollectionRunDto>> getRuns(
            @RequestParam(name = "domain", required = false) String domain,
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "limit", required = false) Integer limit) {
        return ApiResponse.ok(queryService.getRuns(domain, period, limit));
    }

    private boolean isExternal(EsgUserPrincipal principal) {
        return principal != null && principal.getUser().getRole() == UserRole.EXTERNAL_USER;
    }
}
