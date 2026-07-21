package com.esg.platform.domain.notification.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.notification.dto.NotificationDto;
import com.esg.platform.domain.notification.event.NotificationCreatedEvent;
import com.esg.platform.domain.notification.mapper.NotificationMapper;


@Service
@Transactional(readOnly = true)
public class NotificationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationService.class);
    private static final int MAX_LIST_SIZE = 100;

    private final NotificationMapper notificationMapper;
    private final ApplicationEventPublisher eventPublisher;

    public NotificationService(
            NotificationMapper notificationMapper,
            ApplicationEventPublisher eventPublisher) {
        this.notificationMapper = notificationMapper;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void createApprovalRequested(MetricDto metric, Long actorUserId) {
        List<Long> recipients = notificationMapper.findSystemAdminUserIds(metric.getCompanyId());
        if (recipients.isEmpty()) {
            log.warn("[NOTIFICATION] 승인 요청 알림 수신 관리자 없음 companyId={} metricId={}",
                    metric.getCompanyId(), metric.getId());
            return;
        }

        for (Long recipientUserId : recipients) {
            create(
                    recipientUserId,
                    actorUserId,
                    metric,
                    "ESG_APPROVAL_REQUESTED",
                    "ESG 승인 요청",
                    metric.getPeriod() + " " + metric.getTitle() + " 승인 요청이 도착했습니다.",
                    "/admin/approvals?metricId=" + metric.getId() + "&tab=pending");
        }
    }

    @Transactional
    public void createApproved(MetricDto metric, Long actorUserId) {
        Set<Long> recipients = resolveManagerRecipients(metric);
        if (recipients.isEmpty()) {
            log.warn("[NOTIFICATION] 승인 알림 수신자 없음 companyId={} metricId={}",
                    metric.getCompanyId(), metric.getId());
            return;
        }

        for (Long recipientUserId : recipients) {
            create(
                    recipientUserId,
                    actorUserId,
                    metric,
                    "ESG_APPROVED",
                    "ESG 데이터 승인 완료",
                    metric.getPeriod() + " " + metric.getTitle() + " 데이터가 최종 승인되었습니다.",
                    "/manager/metrics?metricId=" + metric.getId() + "&status=APPROVED");
        }
    }

    @Transactional
    public void createRejected(MetricDto metric, Long actorUserId) {
        Set<Long> recipients = resolveManagerRecipients(metric);
        if (recipients.isEmpty()) {
            log.warn("[NOTIFICATION] 반려 알림 수신자 없음 companyId={} metricId={}",
                    metric.getCompanyId(), metric.getId());
            return;
        }

        for (Long recipientUserId : recipients) {
            create(
                    recipientUserId,
                    actorUserId,
                    metric,
                    "ESG_REJECTED",
                    "ESG 데이터 반려",
                    metric.getPeriod() + " " + metric.getTitle() + " 데이터가 반려되었습니다. 사유를 확인해 주세요.",
                    "/manager/metrics?metricId=" + metric.getId() + "&status=REJECTED");
        }
    }

    public List<NotificationDto> getNotifications(Long userId, boolean unreadOnly, Integer limit) {
        int resolvedLimit = limit == null ? 30 : Math.max(1, Math.min(limit, MAX_LIST_SIZE));
        return notificationMapper.findByRecipient(userId, unreadOnly, resolvedLimit);
    }

    public int getUnreadCount(Long userId) {
        return notificationMapper.countUnread(userId);
    }

    @Transactional
    public NotificationDto markRead(Long notificationId, Long userId) {
        notificationMapper.markRead(notificationId, userId);
        return notificationMapper.findByIdAndRecipient(notificationId, userId);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationMapper.markAllRead(userId);
    }

    private Set<Long> resolveManagerRecipients(MetricDto metric) {
        Set<Long> recipients = new LinkedHashSet<>();
        Long ownerUserId = notificationMapper.findMetricOwnerUserId(metric.getId());
        if (ownerUserId != null) {
            recipients.add(ownerUserId);
        }
        if (recipients.isEmpty()) {
            recipients.addAll(notificationMapper.findCompanyManagerUserIds(metric.getCompanyId()));
            if (!recipients.isEmpty()) {
                log.warn("[NOTIFICATION] 지표 작성자 확인 불가, 회사 관리자에게 대체 전송 companyId={} metricId={} recipients={}",
                        metric.getCompanyId(), metric.getId(), recipients.size());
            }
        }
        return recipients;
    }

    private void create(
            Long recipientUserId,
            Long actorUserId,
            MetricDto metric,
            String type,
            String title,
            String message,
            String targetUrl) {
        NotificationDto notification = new NotificationDto();
        notification.setRecipientUserId(recipientUserId);
        notification.setActorUserId(actorUserId);
        notification.setCompanyId(metric.getCompanyId());
        notification.setMetricId(metric.getId());
        notification.setNotificationType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTargetUrl(targetUrl);
        notificationMapper.insert(notification);

        NotificationDto persisted = notificationMapper.findById(notification.getId());
        if (persisted == null) {
            log.warn("[NOTIFICATION] 저장 후 알림 조회 실패 notificationId={} type={} recipientUserId={} metricId={}",
                    notification.getId(), type, recipientUserId, metric.getId());
            return;
        }

        eventPublisher.publishEvent(new NotificationCreatedEvent(persisted));
        log.info("[NOTIFICATION] 저장 notificationId={} type={} recipientUserId={} metricId={}",
                notification.getId(), type, recipientUserId, metric.getId());
    }
}
