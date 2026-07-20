-- =========================================================================
-- 출하액 기반 원단위 계산 및 외부 공공데이터 벤치마크 저장 구조
-- =========================================================================

ALTER TABLE esg_metric_data
    ADD COLUMN IF NOT EXISTS shipment_amount_million_krw NUMERIC(18, 2);

ALTER TABLE esg_metric_data
    DROP CONSTRAINT IF EXISTS ck_esg_metric_shipment_amount_nonnegative;

ALTER TABLE esg_metric_data
    ADD CONSTRAINT ck_esg_metric_shipment_amount_nonnegative
    CHECK (shipment_amount_million_krw IS NULL OR shipment_amount_million_krw >= 0);

COMMENT ON COLUMN esg_metric_data.shipment_amount_million_krw IS
    '동일 사업장·기준기간의 출하액. 전력 사용량 등록 건에 백만원 단위로 저장하며 승인 상태를 함께 적용한다.';

-- 기존 2026년 1~5월 승인 완료 전력 데이터에 사업장별 시연 출하액을 보완한다.
UPDATE esg_metric_data metric
SET shipment_amount_million_krw = CASE facility.facility_name
        WHEN '서울 본사' THEN 1125 + (metric.period_value * 25)
        WHEN '부산공장' THEN 4580 + (metric.period_value * 120)
        WHEN '울산공장' THEN 4050 + (metric.period_value * 105)
        ELSE 1000 + (metric.period_value * 20)
    END,
    updated_at = CURRENT_TIMESTAMP
FROM esg_indicators indicator,
     company_facilities facility,
     companies company
WHERE metric.indicator_id = indicator.id
  AND metric.facility_id = facility.id
  AND metric.company_id = company.id
  AND company.business_number = '123-45-67890'
  AND indicator.indicator_code = 'IND_E_ELEC'
  AND metric.reporting_year = 2026
  AND metric.period_type = 'MONTHLY'
  AND metric.period_value BETWEEN 1 AND 5
  AND metric.status = 'APPROVED'
  AND metric.shipment_amount_million_krw IS NULL;

CREATE INDEX IF NOT EXISTS idx_esg_metric_shipment_lookup
    ON esg_metric_data (company_id, reporting_year, period_value, facility_id, status)
    WHERE shipment_amount_million_krw IS NOT NULL;

CREATE TABLE IF NOT EXISTS external_benchmark_sync_runs (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    base_year INT NOT NULL,
    industry_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    triggered_by INT REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_external_benchmark_sync_runs_latest
    ON external_benchmark_sync_runs (company_id, started_at DESC);

CREATE TABLE IF NOT EXISTS external_benchmark_values (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_code VARCHAR(30) NOT NULL,
    dataset_code VARCHAR(100) NOT NULL,
    metric_code VARCHAR(50) NOT NULL,
    base_year INT NOT NULL,
    industry_code VARCHAR(20) NOT NULL,
    industry_name VARCHAR(255) NOT NULL,
    original_value NUMERIC(24, 6) NOT NULL,
    original_unit VARCHAR(100) NOT NULL,
    normalized_value NUMERIC(24, 6) NOT NULL,
    normalized_unit VARCHAR(100) NOT NULL,
    source_updated_at VARCHAR(100),
    raw_payload JSONB NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_run_id BIGINT REFERENCES external_benchmark_sync_runs(id) ON DELETE SET NULL,
    CONSTRAINT uq_external_benchmark_value UNIQUE (
        company_id, source_code, metric_code, base_year, industry_code
    )
);

CREATE INDEX IF NOT EXISTS idx_external_benchmark_value_lookup
    ON external_benchmark_values (company_id, base_year, industry_code, metric_code);
