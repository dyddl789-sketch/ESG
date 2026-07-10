package com.esg.platform.domain.useradmin.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.useradmin.dto.UserAdminDto;
import com.esg.platform.domain.useradmin.service.UserAdminService;
import com.esg.platform.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserAdminDto>>> getUsers() {
        List<UserAdminDto> users = userAdminService.getUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserAdminDto>> updateRole(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body) {
        UserAdminDto updated = userAdminService.updateRole(id, body.get("role"));
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<ApiResponse<UserAdminDto>> updateActive(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Boolean> body) {
        UserAdminDto updated = userAdminService.updateActive(id, body.get("isActive"));
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable("id") Long id) {
        userAdminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}