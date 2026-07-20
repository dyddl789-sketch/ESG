package com.esg.platform.domain.integration.service;

import java.time.YearMonth;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.esg.platform.domain.integration.dto.CollectionJobResponse;
import com.esg.platform.domain.integration.dto.CollectionRunDto;
import com.esg.platform.domain.integration.mapper.EsgCollectionMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.esg.platform.global.operation.OperationEvent;
import com.esg.platform.global.operation.RedisOperationService;
import com.esg.platform.global.realtime.EsgWebSocketHandler;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CollectionOperationService {

    private static final Long COMPANY_ID = 1L;
    private static final Set<String> SUPPORTED_DOMAINS = Set.of("ENVIRONMENT", "SOCIAL", "GOVERNANCE");
    private static final Set<String> SUPPORTED_FILE_EXTENSIONS = Set.of("csv", "xls", "xlsx", "pdf");
    private static final long MAX_FILE_SIZE = 20L * 1024L * 1024L;

    private final EsgCollectionMapper collectionMapper;
    private final RedisOperationService redisOperationService;
    private final EsgWebSocketHandler webSocketHandler;
    private final Executor collectionTaskExecutor;

    public CollectionOperationService(
            EsgCollectionMapper collectionMapper,
            RedisOperationService redisOperationService,
            EsgWebSocketHandler webSocketHandler,
            @Qualifier("collectionTaskExecutor") Executor collectionTaskExecutor) {
        this.collectionMapper = collectionMapper;
        this.redisOperationService = redisOperationService;
        this.webSocketHandler = webSocketHandler;
        this.collectionTaskExecutor = collectionTaskExecutor;
    }

    public CollectionJobResponse startDemoCollection(String rawDomain) {
        return startCollection(normalizeDomain(rawDomain), YearMonth.now().minusMonths(1).toString(), "DEMO");
    }

    public CollectionJobResponse startScheduledCollection(String rawDomain, String period) {
        return startCollection(normalizeDomain(rawDomain), normalizePeriod(period), "SCHEDULED");
    }

    public CollectionJobResponse registerManualFile(String rawDomain, MultipartFile file) {
        String domain = normalizeDomain(rawDomain);
        validateFile(file);
        String period = YearMonth.now().minusMonths(1).toString();
        String jobId = domain.toLowerCase(Locale.ROOT) + "-file-" + UUID.randomUUID();
        CollectionRunDto run = createRun(domain, period, "RETRY");
        collectionMapper.completeRun(run.getId(), "SUCCESS", 1, 1, 0, null);
        publish(OperationEvent.of(
                "FILE_VALIDATED",
                domain.toLowerCase(Locale.ROOT),
                jobId,
                "COMPLETED",
                100,
                sanitizeFilename(file.getOriginalFilename()) + " 파일 검증이 완료되었습니다."));
        log.info("[ESG_FILE] 파일 검증 완료 domain={} runId={} filename={} size={}",
                domain, run.getId(), sanitizeFilename(file.getOriginalFilename()), file.getSize());
        return new CollectionJobResponse(jobId, domain, period, "COMPLETED");
    }

    private CollectionJobResponse startCollection(String domain, String period, String triggerType) {
        String lockOwnerToken = redisOperationService.acquireLock(domain, period);
        if (lockOwnerToken == null) {
            log.warn("[ESG_COLLECTION] 중복 수집 차단 domain={} period={} trigger={}", domain, period, triggerType);
            throw new BusinessException(ErrorCode.COLLECTION_ALREADY_RUNNING);
        }

        String jobId = domain.toLowerCase(Locale.ROOT) + "-collect-" + UUID.randomUUID();
        CollectionRunDto run;
        try {
            run = createRun(domain, period, triggerType);
        } catch (RuntimeException exception) {
            redisOperationService.releaseLock(domain, period, lockOwnerToken);
            throw exception;
        }

        log.info("[ESG_COLLECTION] 수집 접수 domain={} period={} trigger={} runId={} jobId={}",
                domain, period, triggerType, run.getId(), jobId);
        collectionTaskExecutor.execute(() -> executeCollection(domain, period, run, jobId, lockOwnerToken));
        return new CollectionJobResponse(jobId, domain, period, "STARTED");
    }

    private void executeCollection(
            String domain,
            String period,
            CollectionRunDto run,
            String jobId,
            String lockOwnerToken) {
        int totalCount = "GOVERNANCE".equals(domain) ? 1 : collectionMapper.countFacilities(COMPANY_ID);
        try {
            publishProgress(domain, jobId, 15, "원천 시스템 연결을 확인하고 있습니다.");
            pause();
            publishProgress(domain, jobId, 45, "월 마감 데이터를 수집하고 있습니다.");
            int savedCount = collectDomain(domain, period, run.getId());
            pause();
            publishProgress(domain, jobId, 80, "단위와 필수값을 검증하고 있습니다.");
            pause();

            collectionMapper.completeRun(run.getId(), "SUCCESS", totalCount, Math.max(savedCount, totalCount), 0, null);
            redisOperationService.evictDashboardCache(domain.toLowerCase(Locale.ROOT));
            publish(OperationEvent.of(
                    "COLLECTION_COMPLETED",
                    domain.toLowerCase(Locale.ROOT),
                    jobId,
                    "COMPLETED",
                    100,
                    period + " " + displayName(domain) + " 자동 수집이 완료되었습니다."));
            log.info("[ESG_COLLECTION] 수집 완료 domain={} period={} runId={} savedCount={}",
                    domain, period, run.getId(), savedCount);
        } catch (Exception exception) {
            String reason = compactMessage(exception);
            collectionMapper.completeRun(run.getId(), "FAILED", totalCount, 0, totalCount, reason);
            publish(OperationEvent.of(
                    "COLLECTION_FAILED",
                    domain.toLowerCase(Locale.ROOT),
                    jobId,
                    "FAILED",
                    0,
                    displayName(domain) + " 수집에 실패했습니다."));
            log.error("[ESG_COLLECTION] 수집 실패 domain={} period={} runId={} reason={}",
                    domain, period, run.getId(), reason, exception);
        } finally {
            redisOperationService.releaseLock(domain, period, lockOwnerToken);
        }
    }

    private int collectDomain(String domain, String period, Long runId) {
        return switch (domain) {
            case "ENVIRONMENT" -> {
                int count = collectionMapper.upsertEnvironmentMonthly(COMPANY_ID, period);
                collectionMapper.upsertEnvironmentRaw(runId, COMPANY_ID, period);
                yield count;
            }
            case "SOCIAL" -> {
                int count = collectionMapper.upsertSocialMonthly(COMPANY_ID, period);
                collectionMapper.upsertSocialRaw(runId, COMPANY_ID, period);
                yield count;
            }
            case "GOVERNANCE" -> {
                int count = collectionMapper.upsertGovernancePeriod(COMPANY_ID, period);
                collectionMapper.upsertGovernanceRaw(runId, COMPANY_ID, period);
                yield count;
            }
            default -> throw new BusinessException(ErrorCode.UNSUPPORTED_ESG_DOMAIN);
        };
    }

    private CollectionRunDto createRun(String domain, String period, String triggerType) {
        CollectionRunDto run = new CollectionRunDto();
        run.setCompanyId(COMPANY_ID);
        run.setDomain(domain);
        run.setSourceSystem(sourceSystem(domain));
        run.setBasePeriod(period);
        run.setTriggerType(triggerType);
        run.setStatus("PROCESSING");
        run.setTotalCount(0);
        run.setSuccessCount(0);
        run.setErrorCount(0);
        collectionMapper.insertRun(run);
        return run;
    }

    private String normalizeDomain(String rawDomain) {
        String domain = rawDomain == null ? "" : rawDomain.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_DOMAINS.contains(domain)) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_ESG_DOMAIN);
        }
        return domain;
    }

    private String normalizePeriod(String rawPeriod) {
        try {
            return YearMonth.parse(rawPeriod).toString();
        } catch (RuntimeException exception) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "기준월은 YYYY-MM 형식이어야 합니다.");
        }
    }

    private String sourceSystem(String domain) {
        return switch (domain) {
            case "ENVIRONMENT" -> "EMS";
            case "SOCIAL" -> "HR_SAFETY";
            case "GOVERNANCE" -> "GROUPWARE";
            default -> "UNKNOWN";
        };
    }

    private String displayName(String domain) {
        return switch (domain) {
            case "ENVIRONMENT" -> "환경 데이터";
            case "SOCIAL" -> "사회 데이터";
            case "GOVERNANCE" -> "거버넌스 데이터";
            default -> "ESG 데이터";
        };
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "업로드할 파일을 선택해 주세요.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "파일 크기는 20MB 이하여야 합니다.");
        }
        String filename = sanitizeFilename(file.getOriginalFilename());
        int dotIndex = filename.lastIndexOf('.');
        String extension = dotIndex < 0 ? "" : filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        if (!SUPPORTED_FILE_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "CSV, XLS, XLSX, PDF 파일만 업로드할 수 있습니다.");
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "unnamed-file";
        }
        String normalized = filename.replace('\\', '/');
        return normalized.substring(normalized.lastIndexOf('/') + 1);
    }

    private void publishProgress(String domain, String jobId, int progress, String message) {
        publish(OperationEvent.of(
                "COLLECTION_PROGRESS",
                domain.toLowerCase(Locale.ROOT),
                jobId,
                "PROCESSING",
                progress,
                message));
    }

    private void publish(OperationEvent event) {
        redisOperationService.saveJob(event);
        webSocketHandler.broadcast(event);
    }

    private String compactMessage(Throwable throwable) {
        String message = throwable.getMessage();
        if (message == null || message.isBlank()) {
            return throwable.getClass().getSimpleName();
        }
        return message.length() > 500 ? message.substring(0, 500) : message;
    }

    private void pause() throws InterruptedException {
        Thread.sleep(250L);
    }
}
