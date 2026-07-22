package com.esg.platform.domain.benchmark.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkResponse;
import com.esg.platform.domain.benchmark.service.ExternalBenchmarkService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/external-benchmarks")
@RequiredArgsConstructor
public class ExternalBenchmarkController {

    private final ExternalBenchmarkService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<ExternalBenchmarkResponse> getBenchmark(
            @RequestParam(name = "year", required = false) Integer year,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(service.getBenchmark(companyId(principal), year));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ApiResponse<ExternalBenchmarkResponse> synchronize(
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(service.synchronize(
                companyId(principal),
                principal.getUser().getId().intValue()));
    }

    private Integer companyId(EsgUserPrincipal principal) {
        return principal.getUser().getCompanyId() == null
                ? 1
                : principal.getUser().getCompanyId().intValue();
    }
}
