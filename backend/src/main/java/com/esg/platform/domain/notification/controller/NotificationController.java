package com.esg.platform.domain.notification.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.notification.dto.NotificationDto;
import com.esg.platform.domain.notification.service.NotificationService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;


@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<NotificationDto>> getNotifications(
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(name = "limit", required = false) Integer limit,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(notificationService.getNotifications(
                principal.getUser().getId(), unreadOnly, limit));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Integer>> getUnreadCount(
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(Map.of(
                "count", notificationService.getUnreadCount(principal.getUser().getId())));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationDto> markRead(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(notificationService.markRead(id, principal.getUser().getId()));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Map<String, Integer>> markAllRead(
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(Map.of(
                "updated", notificationService.markAllRead(principal.getUser().getId())));
    }
}
