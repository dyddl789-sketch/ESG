-- 신규 사업장이 과거 외부 비교의 필수 사업장으로 잘못 계산되는 문제를 방지하고,
-- 거버넌스 지표의 기업 공통/사업장별 저장 범위를 명확히 분리한다.

ALTER TABLE company_facilities
    ADD COLUMN IF NOT EXISTS operation_start_date DATE,
    ADD COLUMN IF NOT EXISTS operation_end_date DATE;

-- 기존 사업장은 실제 ESG 데이터가 존재하는 최초 월을 운영 시작일로 사용한다.
-- 실적이 없는 사업장은 등록일을 사용하여 신규 사업장이 과거 기간에 포함되지 않도록 한다.
UPDATE company_facilities facility
SET operation_start_date = COALESCE(
        (
            SELECT MIN(make_date(metric.reporting_year, metric.period_value, 1))
            FROM esg_metric_data metric
            WHERE metric.facility_id = facility.id
              AND metric.period_type = 'MONTHLY'
              AND metric.period_value BETWEEN 1 AND 12
        ),
        facility.created_at::DATE,
        CURRENT_DATE
    )
WHERE facility.operation_start_date IS NULL;

-- 기존에 운영 중지된 사업장은 마지막 월별 ESG 실적이 존재하는 달의 말일을 운영 종료일로 사용한다.
-- 실적이 없다면 등록일을 종료일로 사용하여 이후 기간의 필수 사업장 수에서 제외한다.
UPDATE company_facilities facility
SET operation_end_date = COALESCE(
        (
            SELECT (MAX(make_date(metric.reporting_year, metric.period_value, 1))
                    + INTERVAL '1 month - 1 day')::DATE
            FROM esg_metric_data metric
            WHERE metric.facility_id = facility.id
              AND metric.period_type = 'MONTHLY'
              AND metric.period_value BETWEEN 1 AND 12
        ),
        facility.created_at::DATE,
        facility.operation_start_date
    )
WHERE facility.is_active = FALSE
  AND facility.operation_end_date IS NULL;

ALTER TABLE company_facilities
    ALTER COLUMN operation_start_date SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_company_facility_operation_period'
    ) THEN
        ALTER TABLE company_facilities
            ADD CONSTRAINT ck_company_facility_operation_period
            CHECK (
                operation_end_date IS NULL
                OR operation_end_date >= operation_start_date
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_company_facilities_operation_period
    ON company_facilities (company_id, operation_start_date, operation_end_date);

COMMENT ON COLUMN company_facilities.operation_start_date IS
    '외부데이터 비교 및 기간별 ESG 집계에서 사업장이 포함되기 시작하는 운영 시작일';
COMMENT ON COLUMN company_facilities.operation_end_date IS
    '사업장 운영 종료일. NULL이면 현재도 운영 중인 것으로 간주';

-- 이사회 참석률과 사외이사 비율은 사업장 데이터가 아니라 기업 공통 데이터다.
-- 과거에 사업장별로 중복 저장된 경우 승인 완료 데이터를 우선하여 한 건만 남긴다.
WITH ranked_company_governance AS (
    SELECT metric.id,
           ROW_NUMBER() OVER (
               PARTITION BY metric.company_id,
                            metric.indicator_id,
                            metric.reporting_year,
                            metric.period_type,
                            metric.period_value
               ORDER BY CASE metric.status
                            WHEN 'APPROVED' THEN 1
                            WHEN 'PENDING' THEN 2
                            WHEN 'REJECTED' THEN 3
                            ELSE 4
                        END,
                        metric.updated_at DESC,
                        metric.id DESC
           ) AS row_number
    FROM esg_metric_data metric
    JOIN esg_indicators indicator ON indicator.id = metric.indicator_id
    WHERE indicator.indicator_code IN ('IND_G_ATTENDANCE', 'IND_G_OUTSIDE')
)
DELETE FROM esg_metric_data metric
USING ranked_company_governance ranked
WHERE metric.id = ranked.id
  AND ranked.row_number > 1;

UPDATE esg_metric_data metric
SET facility_id = NULL,
    additional_info = COALESCE(metric.additional_info, '{}'::JSONB)
        || jsonb_build_object('scope', 'COMPANY', 'scopeNormalizedBy', 'V11'),
    updated_at = CURRENT_TIMESTAMP
FROM esg_indicators indicator
WHERE indicator.id = metric.indicator_id
  AND indicator.indicator_code IN ('IND_G_ATTENDANCE', 'IND_G_OUTSIDE')
  AND metric.facility_id IS NOT NULL;

-- 윤리교육 이수율은 반드시 사업장별 데이터로 유지한다.
-- 기존에 기업 공통(NULL)으로 저장된 값은 해당 기업의 본사 데이터로 보정한다.
DELETE FROM esg_metric_data common_ethics
USING esg_indicators indicator,
      esg_metric_data headquarters_ethics,
      company_facilities headquarters
WHERE indicator.id = common_ethics.indicator_id
  AND indicator.indicator_code = 'IND_G_ETHICS_EDU'
  AND common_ethics.facility_id IS NULL
  AND headquarters.company_id = common_ethics.company_id
  AND headquarters.facility_type = 'HQ'
  AND headquarters_ethics.company_id = common_ethics.company_id
  AND headquarters_ethics.facility_id = headquarters.id
  AND headquarters_ethics.indicator_id = common_ethics.indicator_id
  AND headquarters_ethics.reporting_year = common_ethics.reporting_year
  AND headquarters_ethics.period_type = common_ethics.period_type
  AND headquarters_ethics.period_value = common_ethics.period_value;

UPDATE esg_metric_data metric
SET facility_id = (
        SELECT facility.id
        FROM company_facilities facility
        WHERE facility.company_id = metric.company_id
          AND facility.facility_type = 'HQ'
        ORDER BY facility.id
        LIMIT 1
    ),
    additional_info = COALESCE(metric.additional_info, '{}'::JSONB)
        || jsonb_build_object('scope', 'FACILITY', 'scopeNormalizedBy', 'V11'),
    updated_at = CURRENT_TIMESTAMP
FROM esg_indicators indicator
WHERE indicator.id = metric.indicator_id
  AND indicator.indicator_code = 'IND_G_ETHICS_EDU'
  AND metric.facility_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM company_facilities facility
      WHERE facility.company_id = metric.company_id
        AND facility.facility_type = 'HQ'
  );

UPDATE esg_metric_data metric
SET additional_info = COALESCE(metric.additional_info, '{}'::JSONB)
        || jsonb_build_object('scope', 'FACILITY')
FROM esg_indicators indicator
WHERE indicator.id = metric.indicator_id
  AND indicator.indicator_code = 'IND_G_ETHICS_EDU'
  AND metric.facility_id IS NOT NULL;
