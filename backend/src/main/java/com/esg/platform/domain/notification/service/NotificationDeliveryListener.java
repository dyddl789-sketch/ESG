package com.esg.platform.domain.notification.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.esg.platform.domain.notification.dto.NotificationDto;
import com.esg.platform.domain.notification.event.NotificationCreatedEvent;
import com.esg.platform.global.realtime.EsgWebSocketHandler;


@Component
public class NotificationDeliveryListener {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationDeliveryListener.class);
    private final EsgWebSocketHandler webSocketHandler;

    public NotificationDeliveryListener(EsgWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void deliver(NotificationCreatedEvent event) {
        NotificationDto notification = event.notification();
        try {
            webSocketHandler.sendToUser(notification.getRecipientUserId(), notification);
            log.info("[NOTIFICATION] WebSocket 전송 notificationId={} recipientUserId={} type={}",
                    notification.getId(), notification.getRecipientUserId(), notification.getNotificationType());
        } catch (RuntimeException exception) {
            log.warn("[NOTIFICATION] WebSocket 전송 실패 notificationId={} recipientUserId={} type={}",
                    notification.getId(), notification.getRecipientUserId(), notification.getNotificationType(), exception);
        }
    }
}
