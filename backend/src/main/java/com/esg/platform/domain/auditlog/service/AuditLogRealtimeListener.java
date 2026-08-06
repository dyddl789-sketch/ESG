package com.esg.platform.domain.auditlog.service;

import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.esg.platform.domain.auditlog.event.AuditLogChangedEvent;
import com.esg.platform.global.realtime.EsgWebSocketHandler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditLogRealtimeListener {

    private static final Set<String> AUDIT_VIEW_ROLES = Set.of("SYSTEM_ADMIN");

    private final EsgWebSocketHandler webSocketHandler;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void deliver(AuditLogChangedEvent event) {
        Map<String, Object> payload = Map.of(
                "type", "AUDIT_LOG_UPDATED",
                "domain", "AUDIT_LOG",
                "status", "UPDATED",
                "companyId", event.companyId(),
                "metricId", event.metricId(),
                "action", event.action(),
                "period", event.period() == null ? "" : event.period(),
                "category", event.category() == null ? "" : event.category(),
                "facilityId", event.facilityId() == null ? "" : event.facilityId(),
                "occurredAt", event.occurredAt().toString());
        try {
            webSocketHandler.sendToRoles(AUDIT_VIEW_ROLES, payload);
            log.info("[AUDIT_REALTIME] 갱신 신호 전송 metricId={} action={} period={} facilityId={}",
                    event.metricId(), event.action(), event.period(), event.facilityId());
        } catch (RuntimeException exception) {
            log.warn("[AUDIT_REALTIME] 갱신 신호 전송 실패 metricId={} action={} reason={}",
                    event.metricId(), event.action(), exception.getClass().getSimpleName(), exception);
        }
    }
}
