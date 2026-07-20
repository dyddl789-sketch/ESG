package com.esg.platform.global.operation;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.esg.platform.domain.integration.dto.CollectionJobResponse;
import com.esg.platform.domain.integration.service.CollectionOperationService;
import com.esg.platform.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/manager/operations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
public class OperationController {

    private final CollectionOperationService collectionOperationService;

    @PostMapping("/collect/{domain}")
    public ApiResponse<CollectionJobResponse> collect(@PathVariable(name = "domain") String domain) {
        return ApiResponse.ok(collectionOperationService.startDemoCollection(domain));
    }

    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CollectionJobResponse> upload(
            @RequestParam(name = "domain") String domain,
            @RequestParam(name = "file") MultipartFile file) {
        return ApiResponse.ok(collectionOperationService.registerManualFile(domain, file));
    }
}
