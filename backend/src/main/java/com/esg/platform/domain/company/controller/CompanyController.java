package com.esg.platform.domain.company.controller;

import com.esg.platform.domain.company.dto.CompanyDto;
import com.esg.platform.domain.company.dto.FacilityDto;
import com.esg.platform.domain.company.service.CompanyService;
import com.esg.platform.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto>> getCompany() {
        CompanyDto company = companyService.getCompany();
        return ResponseEntity.ok(ApiResponse.ok(company));
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<CompanyDto>> updateCompany(@RequestBody CompanyDto dto) {
        CompanyDto updated = companyService.updateCompany(dto);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/me/facilities")
    public ResponseEntity<ApiResponse<List<FacilityDto>>> getFacilities() {
        List<FacilityDto> facilities = companyService.getFacilities();
        return ResponseEntity.ok(ApiResponse.ok(facilities));
    }

    @PostMapping("/me/facilities")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<FacilityDto>> createFacility(@RequestBody FacilityDto dto) {
        FacilityDto created = companyService.createFacility(dto);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @PutMapping("/me/facilities/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<FacilityDto>> updateFacility(
            @PathVariable("id") Long id,
            @RequestBody FacilityDto dto) {
        FacilityDto updated = companyService.updateFacility(id, dto);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/me/facilities/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteFacility(@PathVariable("id") Long id) {
        companyService.deleteFacility(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}