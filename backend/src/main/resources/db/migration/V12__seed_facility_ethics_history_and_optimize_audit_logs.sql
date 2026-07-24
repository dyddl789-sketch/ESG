-- =========================================================================
-- [Flyway V12]
-- 1) 2024-01 ~ 2026-05 운영 사업장별 윤리교육 이수율 승인 이력 보완
-- 2) 감사 로그 사업장·지표·작업·기간 필터 및 페이징 조회 인덱스 보강
--
-- 기존 V10(알림), V11(거버넌스 범위·사업장 운영기간)이 존재하므로
-- 실행된 마이그레이션을 수정하지 않고 V12로 추가한다.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. 감사 로그 서버 페이징 및 필터 조회용 인덱스
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_esg_performed_at
    ON audit_logs (performed_at DESC, id DESC)
    WHERE table_name = 'esg_metric_data';

CREATE INDEX IF NOT EXISTS idx_audit_logs_esg_facility_performed_at
    ON audit_logs (
        (NULLIF(COALESCE(new_values ->> 'facility_id', old_values ->> 'facility_id'), '')::BIGINT),
        performed_at DESC
    )
    WHERE table_name = 'esg_metric_data';

CREATE INDEX IF NOT EXISTS idx_audit_logs_esg_indicator_performed_at
    ON audit_logs (
        (NULLIF(COALESCE(new_values ->> 'indicator_id', old_values ->> 'indicator_id'), '')::BIGINT),
        performed_at DESC
    )
    WHERE table_name = 'esg_metric_data';

-- -------------------------------------------------------------------------
-- 2. 운영기간에 포함되는 사업장·월별 윤리교육 이수율 후보 생성
--    운영 시작일이 월 중간이어도 해당 월은 포함하고, 종료월까지 포함한다.
-- -------------------------------------------------------------------------
CREATE TEMP TABLE v12_ethics_candidates ON COMMIT DROP AS
WITH target_company AS (
    SELECT id
    FROM companies
    WHERE business_number = '123-45-67890'
    LIMIT 1
), ethics_indicator AS (
    SELECT id
    FROM esg_indicators
    WHERE indicator_code = 'IND_G_ETHICS_EDU'
    LIMIT 1
), periods AS (
    SELECT period_start::DATE AS period_start,
           EXTRACT(YEAR FROM period_start)::INT AS reporting_year,
           EXTRACT(MONTH FROM period_start)::INT AS period_value,
           (period_start + INTERVAL '1 month - 1 day')::DATE AS period_end
    FROM generate_series(
        DATE '2024-01-01',
        DATE '2026-05-01',
        INTERVAL '1 month'
    ) AS series(period_start)
), ranked_facilities AS (
    SELECT facility.id,
           facility.company_id,
           facility.facility_name,
           facility.facility_type,
           facility.operation_start_date,
           facility.operation_end_date,
           ROW_NUMBER() OVER (
               PARTITION BY facility.company_id
               ORDER BY CASE WHEN facility.facility_type = 'HQ' THEN 0 ELSE 1 END,
                        facility.id
           ) AS facility_rank
    FROM company_facilities facility
    WHERE facility.company_id = (SELECT id FROM target_company)
), operating_periods AS (
    SELECT facility.id AS facility_id,
           facility.company_id,
           facility.facility_name,
           facility.facility_type,
           facility.facility_rank,
           period.reporting_year,
           period.period_value,
           period.period_start,
           GREATEST(
               30,
               70
                   + (facility.facility_rank * 55)
                   + ((period.reporting_year - 2024) * 9)
                   + period.period_value
           )::INT AS eligible_count,
           LEAST(
               99.80,
               CASE facility.facility_name
                   WHEN '서울 본사' THEN 89.40
                   WHEN '부산공장' THEN 87.20
                   WHEN '울산공장' THEN 86.50
                   ELSE 86.00 + (facility.facility_rank * 0.35)
               END
               + ((period.reporting_year - 2024) * 2.35)
               + (period.period_value * 0.38)
           )::NUMERIC(18,4) AS ethics_rate
    FROM ranked_facilities facility
    CROSS JOIN periods period
    WHERE facility.operation_start_date <= period.period_end
      AND (
          facility.operation_end_date IS NULL
          OR facility.operation_end_date >= period.period_start
      )
)
SELECT operating.facility_id,
       operating.company_id,
       operating.facility_name,
       (SELECT id FROM ethics_indicator) AS indicator_id,
       operating.reporting_year,
       operating.period_value,
       operating.eligible_count,
       ROUND((operating.eligible_count * operating.ethics_rate / 100.0), 0)::INT AS completed_count,
       ROUND(operating.ethics_rate, 4) AS ethics_rate,
       make_timestamptz(
           operating.reporting_year,
           operating.period_value,
           20,
           9,
           35,
           0,
           'Asia/Seoul'
       ) AS created_at,
       make_timestamptz(
           operating.reporting_year,
           operating.period_value,
           22,
           15,
           35,
           0,
           'Asia/Seoul'
       ) AS approved_at
FROM operating_periods operating
WHERE (SELECT id FROM ethics_indicator) IS NOT NULL;

-- -------------------------------------------------------------------------
-- 3. 기존 값은 유지하고 누락된 사업장·연월만 추가
-- -------------------------------------------------------------------------
INSERT INTO esg_metric_data (
    company_id,
    facility_id,
    indicator_id,
    reporting_year,
    period_type,
    period_value,
    numerical_value,
    evidence_file_url,
    status,
    data_source_type,
    input_user_id,
    approver_user_id,
    additional_info,
    created_at,
    updated_at
)
SELECT candidate.company_id,
       candidate.facility_id,
       candidate.indicator_id,
       candidate.reporting_year,
       'MONTHLY',
       candidate.period_value,
       candidate.ethics_rate,
       NULL,
       'APPROVED',
       'DEMO',
       manager.id,
       admin.id,
       jsonb_build_object(
           'migrationVersion', 'V12',
           'registrationMethod', 'DEMO_HISTORY',
           'scope', 'FACILITY',
           'facilityName', candidate.facility_name,
           'eligibleCount', candidate.eligible_count,
           'completedCount', candidate.completed_count,
           'workflowSeed', 'DRAFT_TO_APPROVED'
       ),
       candidate.created_at,
       candidate.approved_at
FROM v12_ethics_candidates candidate
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
) admin
WHERE NOT EXISTS (
    SELECT 1
    FROM esg_metric_data existing
    WHERE existing.company_id = candidate.company_id
      AND existing.facility_id = candidate.facility_id
      AND existing.indicator_id = candidate.indicator_id
      AND existing.reporting_year = candidate.reporting_year
      AND existing.period_type = 'MONTHLY'
      AND existing.period_value = candidate.period_value
)
ON CONFLICT DO NOTHING;

-- V12에서 실제로 새로 생성한 지표만 후속 승인·감사 이력 대상으로 고정한다.
CREATE TEMP TABLE v12_ethics_metric_timeline ON COMMIT DROP AS
SELECT metric.id AS metric_id,
       metric.created_at,
       metric.created_at + INTERVAL '1 day 2 hour' AS requested_at,
       metric.updated_at AS approved_at
FROM esg_metric_data metric
JOIN esg_indicators indicator ON indicator.id = metric.indicator_id
WHERE indicator.indicator_code = 'IND_G_ETHICS_EDU'
  AND metric.additional_info ->> 'migrationVersion' = 'V12';

-- INSERT 트리거가 마이그레이션 실행시각으로 남긴 자동 로그를 제거하고,
-- 실제 더미 업무일정에 맞는 등록·승인요청·최종승인 로그를 다시 적재한다.
DELETE FROM audit_logs
WHERE table_name = 'esg_metric_data'
  AND record_id IN (SELECT metric_id FROM v12_ethics_metric_timeline);

-- -------------------------------------------------------------------------
-- 4. 승인 이력: 등록 → 승인 요청 → 최종 승인
-- -------------------------------------------------------------------------
INSERT INTO esg_approval_history (
    metric_data_id,
    action_type,
    from_status,
    to_status,
    comment,
    actor_user_id,
    acted_at
)
SELECT timeline.metric_id,
       'CREATE',
       NULL,
       'DRAFT',
       '사업장별 윤리교육 대상자와 이수 인원을 기준으로 월 실적을 등록했습니다.',
       manager.id,
       timeline.created_at
FROM v12_ethics_metric_timeline timeline
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO esg_approval_history (
    metric_data_id,
    action_type,
    from_status,
    to_status,
    comment,
    actor_user_id,
    acted_at
)
SELECT timeline.metric_id,
       'REQUEST_APPROVAL',
       'DRAFT',
       'PENDING',
       '사업장별 윤리교육 이수 현황을 검토하고 최종 승인을 요청했습니다.',
       manager.id,
       timeline.requested_at
FROM v12_ethics_metric_timeline timeline
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO esg_approval_history (
    metric_data_id,
    action_type,
    from_status,
    to_status,
    comment,
    actor_user_id,
    acted_at
)
SELECT timeline.metric_id,
       'APPROVE',
       'PENDING',
       'APPROVED',
       '윤리교육 대상자·이수자 수와 산정 비율을 확인하여 최종 승인했습니다.',
       admin.id,
       timeline.approved_at
FROM v12_ethics_metric_timeline timeline
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
) admin;

-- -------------------------------------------------------------------------
-- 5. 감사 로그: 데이터 등록 → 승인 요청 → 최종 승인
-- -------------------------------------------------------------------------
INSERT INTO audit_logs (
    user_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values,
    performed_at
)
SELECT manager.id,
       'INSERT',
       'esg_metric_data',
       metric.id,
       NULL,
       to_jsonb(metric) || jsonb_build_object(
           'status', 'DRAFT',
           'approver_user_id', NULL,
           'updated_at', timeline.created_at
       ),
       timeline.created_at
FROM esg_metric_data metric
JOIN v12_ethics_metric_timeline timeline ON timeline.metric_id = metric.id
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO audit_logs (
    user_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values,
    performed_at
)
SELECT manager.id,
       'UPDATE',
       'esg_metric_data',
       metric.id,
       to_jsonb(metric) || jsonb_build_object(
           'status', 'DRAFT',
           'approver_user_id', NULL,
           'updated_at', timeline.created_at
       ),
       to_jsonb(metric) || jsonb_build_object(
           'status', 'PENDING',
           'approver_user_id', NULL,
           'updated_at', timeline.requested_at
       ),
       timeline.requested_at
FROM esg_metric_data metric
JOIN v12_ethics_metric_timeline timeline ON timeline.metric_id = metric.id
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO audit_logs (
    user_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values,
    performed_at
)
SELECT admin.id,
       'UPDATE',
       'esg_metric_data',
       metric.id,
       to_jsonb(metric) || jsonb_build_object(
           'status', 'PENDING',
           'approver_user_id', NULL,
           'updated_at', timeline.requested_at
       ),
       to_jsonb(metric) || jsonb_build_object(
           'status', 'APPROVED',
           'approver_user_id', admin.id,
           'updated_at', timeline.approved_at
       ),
       timeline.approved_at
FROM esg_metric_data metric
JOIN v12_ethics_metric_timeline timeline ON timeline.metric_id = metric.id
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
) admin;
