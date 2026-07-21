package com.esg.platform.domain.notification.event;

import com.esg.platform.domain.notification.dto.NotificationDto;

public record NotificationCreatedEvent(NotificationDto notification) {
}
