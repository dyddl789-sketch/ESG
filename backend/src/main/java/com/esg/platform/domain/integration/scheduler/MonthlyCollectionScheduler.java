package com.esg.platform.domain.integration.scheduler;

import java.time.YearMonth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.esg.platform.domain.integration.service.CollectionOperationService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "app.collection",
        name = "scheduler-enabled",
        havingValue = "true",
        matchIfMissing = true)
public class MonthlyCollectionScheduler {

    private final CollectionOperationService collectionOperationService;

    @Scheduled(cron = "${app.collection.monthly-cron:0 0 3 1 * *}", zone = "${app.collection.zone:Asia/Seoul}")
    public void collectPreviousMonth() {
        String previousMonth = YearMonth.now().minusMonths(1).toString();
        log.info("[ESG_SCHEDULER] 월간 수집 시작 period={}", previousMonth);
        startSafely("environment", previousMonth);
        startSafely("social", previousMonth);
        startSafely("governance", previousMonth);
    }

    private void startSafely(String domain, String period) {
        try {
            collectionOperationService.startScheduledCollection(domain, period);
        } catch (BusinessException exception) {
            if (exception.getErrorCode() == ErrorCode.COLLECTION_ALREADY_RUNNING) {
                log.info("[ESG_SCHEDULER] 이미 실행 중인 작업 건너뜀 domain={} period={}", domain, period);
                return;
            }
            log.warn(
                    "[ESG_SCHEDULER] 수집 요청 실패 domain={} period={} code={}",
                    domain,
                    period,
                    exception.getErrorCode().getCode(),
                    exception);
        } catch (RuntimeException exception) {
            log.error("[ESG_SCHEDULER] 수집 요청 예외 domain={} period={}", domain, period, exception);
        }
    }
}
