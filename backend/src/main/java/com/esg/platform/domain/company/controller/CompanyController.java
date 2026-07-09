package com.esg.platform.domain.company.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.company.dto.CompanyDto;
import com.esg.platform.domain.company.dto.FacilityDto;
import com.esg.platform.domain.company.service.CompanyService;
import com.esg.platform.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    // 기업 기본정보 조회 (전체 역할 접근 가능)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto>> getCompany() {
        CompanyDto company = companyService.getCompany();
        return ResponseEntity.ok(ApiResponse.success(company));
    }

    // 기업 기본정보 수정 (SUPER_ADMIN, ADMIN만 가능)
    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<CompanyDto>> updateCompany(@RequestBody CompanyDto dto) {
        CompanyDto updated = companyService.updateCompany(dto);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    // 사업장 목록 조회 (전체 역할 접근 가능)
    @GetMapping("/me/facilities")
    public ResponseEntity<ApiResponse<List<FacilityDto>>> getFacilities() {
        List<FacilityDto> facilities = companyService.getFacilities();
        return ResponseEntity.ok(ApiResponse.success(facilities));
    }

    // 사업장 등록 (SUPER_ADMIN, ADMIN만 가능)
    @PostMapping("/me/facilities")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacilityDto>> createFacility(@RequestBody FacilityDto dto) {
        FacilityDto created = companyService.createFacility(dto);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    // 사업장 수정 (SUPER_ADMIN, ADMIN만 가능)
    @PutMapping("/me/facilities/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<FacilityDto>> updateFacility(
            @PathVariable Long id,
            @RequestBody FacilityDto dto) {
        FacilityDto updated = companyService.updateFacility(id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    // 사업장 삭제 (SUPER_ADMIN, ADMIN만 가능)
    @DeleteMapping("/me/facilities/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteFacility(@PathVariable Long id) {
        companyService.deleteFacility(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
