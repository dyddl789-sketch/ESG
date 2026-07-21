package com.esg.platform.domain.notification.dto;

import java.time.OffsetDateTime;

public class NotificationDto {
    private Long id;
    private Long recipientUserId;
    private Long actorUserId;
    private String actorName;
    private Long companyId;
    private Long metricId;
    private String notificationType;
    private String title;
    private String message;
    private String targetUrl;
    private boolean read;
    private OffsetDateTime readAt;
    private OffsetDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(Long recipientUserId) { this.recipientUserId = recipientUserId; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getMetricId() { return metricId; }
    public void setMetricId(Long metricId) { this.metricId = metricId; }
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public OffsetDateTime getReadAt() { return readAt; }
    public void setReadAt(OffsetDateTime readAt) { this.readAt = readAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
