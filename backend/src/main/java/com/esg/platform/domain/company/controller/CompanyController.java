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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CompanyDto>> getCompany() {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getCompany()));
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<CompanyDto>> updateCompany(@RequestBody CompanyDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.updateCompany(dto)));
    }

    @GetMapping("/me/facilities")
    public ResponseEntity<ApiResponse<List<FacilityDto>>> getFacilities() {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getFacilities()));
    }

    @GetMapping("/me/facilities/{id}")
    public ResponseEntity<ApiResponse<FacilityDto>> getFacility(@PathVariable(name = "id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getFacility(id)));
    }

    @PostMapping("/me/facilities")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<FacilityDto>> createFacility(@Valid @RequestBody FacilityDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.createFacility(dto)));
    }

    @PutMapping("/me/facilities/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<FacilityDto>> updateFacility(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody FacilityDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.updateFacility(id, dto)));
    }

    @DeleteMapping("/me/facilities/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteFacility(@PathVariable(name = "id") Long id) {
        companyService.deleteFacility(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
