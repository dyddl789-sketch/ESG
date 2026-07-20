package com.esg.platform.domain.benchmark.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkSyncRun;
import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkValue;
import com.esg.platform.domain.benchmark.mapper.ExternalBenchmarkMapper;
import com.esg.platform.domain.benchmark.service.PublicDataBenchmarkClient.FetchedValue;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExternalBenchmarkPersistenceService {

    private final ExternalBenchmarkMapper mapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long startRun(Integer companyId, Integer userId, int baseYear, String industryCode) {
        ExternalBenchmarkSyncRun run = new ExternalBenchmarkSyncRun();
        run.setCompanyId(companyId);
        run.setTriggeredBy(userId);
        run.setBaseYear(baseYear);
        run.setIndustryCode(industryCode);
        run.setStatus("RUNNING");
        mapper.insertSyncRun(run);
        return run.getId();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveSuccess(
            Long runId,
            Integer companyId,
            int baseYear,
            String industryCode,
            String industryName,
            List<FetchedValue> fetchedValues) {
        for (FetchedValue fetched : fetchedValues) {
            ExternalBenchmarkValue value = new ExternalBenchmarkValue();
            value.setCompanyId(companyId);
            value.setSourceCode(fetched.sourceCode());
            value.setDatasetCode(fetched.datasetCode());
            value.setMetricCode(fetched.metricCode());
            value.setBaseYear(baseYear);
            value.setIndustryCode(industryCode);
            value.setIndustryName(industryName);
            value.setOriginalValue(fetched.originalValue());
            value.setOriginalUnit(fetched.originalUnit());
            value.setNormalizedValue(fetched.normalizedValue());
            value.setNormalizedUnit(fetched.normalizedUnit());
            value.setSourceUpdatedAt(fetched.sourceUpdatedAt());
            value.setRawPayload(fetched.rawPayload());
            value.setSyncRunId(runId);
            mapper.upsertValue(value);
        }
        mapper.completeSyncRun(runId, "SYNCED", null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveFailure(Long runId, String message) {
        String normalized = message == null ? "외부 공공데이터 동기화 실패" : message;
        mapper.completeSyncRun(runId, "FAILED", normalized.substring(0, Math.min(normalized.length(), 1000)));
    }
}
