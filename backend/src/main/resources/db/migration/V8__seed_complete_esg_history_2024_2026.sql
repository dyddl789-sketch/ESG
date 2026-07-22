-- =========================================================================
-- [Flyway V8] 2024~2026년 5월 ESG 확정 실적·출하액·승인 이력·감사 로그
-- 2024/2025: 1~12월, 2026: 1~5월
-- 2026년 6월 이후는 신규 등록·승인 시연을 위해 생성하지 않는다.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. 연도별 전력 배출계수와 내부 평가 기준 보강
-- -------------------------------------------------------------------------
INSERT INTO emission_factors (
    energy_type, factor_value, factor_unit, reference_year, source, is_active
)
VALUES
    ('ELECTRICITY_KR', 0.459400, 'tCO2eq/MWh', 2024, '국가 온실가스 배출계수 시연값', TRUE),
    ('ELECTRICITY_KR', 0.456700, 'tCO2eq/MWh', 2025, '국가 온실가스 배출계수 시연값', TRUE),
    ('ELECTRICITY_KR', 0.452100, 'tCO2eq/MWh', 2026, '국가 온실가스 배출계수 시연값', TRUE)
ON CONFLICT (energy_type, reference_year) DO UPDATE
SET factor_value = EXCLUDED.factor_value,
    factor_unit = EXCLUDED.factor_unit,
    source = EXCLUDED.source,
    is_active = TRUE;

INSERT INTO esg_evaluation_configs (
    company_id, reporting_year, evaluation_name, evaluation_version, disclaimer,
    environment_weight, social_weight, governance_weight
)
SELECT c.id,
       y.reporting_year,
       'KCGS 평가체계 준용 내부 ESG 지수',
       y.reporting_year || ' 내부관리 기준 v1.0',
       '본 지수는 당사의 개선활동 관리를 위한 자체 산정 결과이며 외부 ESG 평가기관의 공식 등급이 아닙니다.',
       40.00, 35.00, 25.00
FROM companies c
CROSS JOIN (VALUES (2024), (2025), (2026)) AS y(reporting_year)
WHERE c.business_number = '123-45-67890'
ON CONFLICT (company_id, reporting_year) DO UPDATE
SET evaluation_name = EXCLUDED.evaluation_name,
    evaluation_version = EXCLUDED.evaluation_version,
    disclaimer = EXCLUDED.disclaimer,
    environment_weight = EXCLUDED.environment_weight,
    social_weight = EXCLUDED.social_weight,
    governance_weight = EXCLUDED.governance_weight,
    updated_at = CURRENT_TIMESTAMP;

-- -------------------------------------------------------------------------
-- 2. V8 관리 범위의 기존 시연 데이터·이력·감사 로그 정리
--    사용자 시연용 2026년 6월 이후 데이터는 보존한다.
-- -------------------------------------------------------------------------
CREATE TEMP TABLE v8_old_metric_ids ON COMMIT DROP AS
SELECT m.id
FROM esg_metric_data m
JOIN companies c ON c.id = m.company_id
WHERE c.business_number = '123-45-67890'
  AND (
      m.reporting_year IN (2024, 2025)
      OR (m.reporting_year = 2026 AND m.period_value BETWEEN 1 AND 5)
  );

DELETE FROM audit_logs
WHERE table_name = 'esg_metric_data'
  AND record_id IN (SELECT id FROM v8_old_metric_ids);

DELETE FROM esg_metric_data
WHERE id IN (SELECT id FROM v8_old_metric_ids);

DELETE FROM esg_scores
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND (
      reporting_year IN (2024, 2025)
      OR (reporting_year = 2026 AND period_value BETWEEN 1 AND 5)
  );

-- -------------------------------------------------------------------------
-- 3. 환경 데이터: 전력 사용량 + 동일 승인 단위의 출하액
-- -------------------------------------------------------------------------
WITH company_row AS (
    SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1
), manager_row AS (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
), periods AS (
    SELECT 2024 AS reporting_year, generate_series(1, 12) AS month_no
    UNION ALL
    SELECT 2025, generate_series(1, 12)
    UNION ALL
    SELECT 2026, generate_series(1, 5)
), facilities AS (
    SELECT id, facility_name
    FROM company_facilities
    WHERE company_id = (SELECT id FROM company_row)
), electricity_values AS (
    SELECT f.id AS facility_id,
           f.facility_name,
           p.reporting_year,
           p.month_no,
           CASE f.facility_name
               WHEN '서울 본사' THEN 150000 - ((p.reporting_year - 2024) * 8500) - (p.month_no * 950)
               WHEN '부산공장' THEN 535000 - ((p.reporting_year - 2024) * 23500) - (p.month_no * 2850)
               WHEN '울산공장' THEN 482000 - ((p.reporting_year - 2024) * 20500) - (p.month_no * 2450)
               ELSE 130000 - ((p.reporting_year - 2024) * 7000) - (p.month_no * 800)
           END::NUMERIC(18,4) AS usage_kwh,
           CASE f.facility_name
               WHEN '서울 본사' THEN 1050 + ((p.reporting_year - 2024) * 95) + (p.month_no * 24)
               WHEN '부산공장' THEN 4250 + ((p.reporting_year - 2024) * 260) + (p.month_no * 82)
               WHEN '울산공장' THEN 3860 + ((p.reporting_year - 2024) * 235) + (p.month_no * 74)
               ELSE 1000 + ((p.reporting_year - 2024) * 80) + (p.month_no * 20)
           END::NUMERIC(18,2) AS shipment_million_krw
    FROM facilities f
    CROSS JOIN periods p
)
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, shipment_amount_million_krw, evidence_file_url, status,
    data_source_type, input_user_id, approver_user_id, additional_info,
    created_at, updated_at
)
SELECT (SELECT id FROM company_row),
       e.facility_id,
       i.id,
       e.reporting_year,
       'MONTHLY',
       e.month_no,
       e.usage_kwh,
       e.shipment_million_krw,
       NULL,
       'DRAFT',
       'DEMO',
       (SELECT id FROM manager_row),
       NULL,
       jsonb_build_object(
           'migrationVersion', 'V8',
           'registrationMethod', 'DEMO_HISTORY',
           'facilityName', e.facility_name,
           'shipmentUnit', 'MILLION_KRW',
           'workflowSeed', 'DRAFT_TO_APPROVED'
       ),
       make_timestamptz(e.reporting_year, e.month_no, 20, 9, 0, 0, 'Asia/Seoul'),
       make_timestamptz(e.reporting_year, e.month_no, 20, 9, 0, 0, 'Asia/Seoul')
FROM electricity_values e
JOIN esg_indicators i ON i.indicator_code = 'IND_E_ELEC';

-- Scope 2 = 전력 사용량(kWh) / 1000 × 해당 연도 배출계수
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, emission_factor_id, additional_info,
    created_at, updated_at
)
SELECT electricity.company_id,
       electricity.facility_id,
       scope_indicator.id,
       electricity.reporting_year,
       electricity.period_type,
       electricity.period_value,
       ROUND((electricity.numerical_value / 1000.0) * factor.factor_value, 4),
       NULL,
       'DRAFT',
       'CALCULATION',
       electricity.input_user_id,
       NULL,
       factor.factor_id,
       jsonb_build_object(
           'migrationVersion', 'V8',
           'registrationMethod', 'DEMO_HISTORY',
           'formula', '전력 사용량(kWh) / 1000 × 연도별 배출계수',
           'workflowSeed', 'DRAFT_TO_APPROVED'
       ),
       electricity.created_at + INTERVAL '5 minute',
       electricity.created_at + INTERVAL '5 minute'
FROM esg_metric_data electricity
JOIN esg_indicators electricity_indicator
  ON electricity_indicator.id = electricity.indicator_id
 AND electricity_indicator.indicator_code = 'IND_E_ELEC'
JOIN esg_indicators scope_indicator
  ON scope_indicator.indicator_code = 'IND_E_SCOPE2'
JOIN emission_factors factor
  ON factor.energy_type = 'ELECTRICITY_KR'
 AND factor.reference_year = electricity.reporting_year
WHERE electricity.additional_info ->> 'migrationVersion' = 'V8';

-- -------------------------------------------------------------------------
-- 4. 사회 데이터: 사업장별 핵심 지표 4개
-- -------------------------------------------------------------------------
WITH company_row AS (
    SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1
), manager_row AS (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
), periods AS (
    SELECT 2024 AS reporting_year, generate_series(1, 12) AS month_no
    UNION ALL
    SELECT 2025, generate_series(1, 12)
    UNION ALL
    SELECT 2026, generate_series(1, 5)
), facilities AS (
    SELECT id, facility_name
    FROM company_facilities
    WHERE company_id = (SELECT id FROM company_row)
), social_values AS (
    SELECT f.id AS facility_id,
           f.facility_name,
           p.reporting_year,
           p.month_no,
           indicator_row.indicator_code,
           CASE indicator_row.indicator_code
               WHEN 'IND_S_INJURY_RATE' THEN GREATEST(
                   0.00,
                   CASE f.facility_name
                       WHEN '서울 본사' THEN 0.04
                       WHEN '부산공장' THEN 0.42
                       ELSE 0.36
                   END - ((p.reporting_year - 2024) * 0.07) - (p.month_no * 0.009)
               )
               WHEN 'IND_S_SAFETY_EDU' THEN LEAST(
                   100.00,
                   CASE f.facility_name
                       WHEN '서울 본사' THEN 94.0
                       WHEN '부산공장' THEN 86.0
                       ELSE 88.0
                   END + ((p.reporting_year - 2024) * 2.4) + (p.month_no * 0.55)
               )
               WHEN 'IND_S_RISK_ACTION' THEN LEAST(
                   100.00,
                   CASE f.facility_name
                       WHEN '서울 본사' THEN 96.0
                       WHEN '부산공장' THEN 76.0
                       ELSE 79.0
                   END + ((p.reporting_year - 2024) * 4.0) + (p.month_no * 0.95)
               )
               WHEN 'IND_S_TURNOVER' THEN GREATEST(
                   0.10,
                   CASE f.facility_name
                       WHEN '서울 본사' THEN 1.20
                       WHEN '부산공장' THEN 3.90
                       ELSE 3.50
                   END - ((p.reporting_year - 2024) * 0.45) - (p.month_no * 0.07)
               )
           END::NUMERIC(18,4) AS metric_value
    FROM facilities f
    CROSS JOIN periods p
    CROSS JOIN (VALUES
        ('IND_S_INJURY_RATE'),
        ('IND_S_SAFETY_EDU'),
        ('IND_S_RISK_ACTION'),
        ('IND_S_TURNOVER')
    ) AS indicator_row(indicator_code)
)
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT (SELECT id FROM company_row),
       s.facility_id,
       i.id,
       s.reporting_year,
       'MONTHLY',
       s.month_no,
       ROUND(s.metric_value, 4),
       NULL,
       'DRAFT',
       'DEMO',
       (SELECT id FROM manager_row),
       NULL,
       jsonb_build_object(
           'migrationVersion', 'V8',
           'registrationMethod', 'DEMO_HISTORY',
           'facilityName', s.facility_name,
           'workflowSeed', 'DRAFT_TO_APPROVED'
       ),
       make_timestamptz(s.reporting_year, s.month_no, 20, 9, 20, 0, 'Asia/Seoul'),
       make_timestamptz(s.reporting_year, s.month_no, 20, 9, 20, 0, 'Asia/Seoul')
FROM social_values s
JOIN esg_indicators i ON i.indicator_code = s.indicator_code;

-- -------------------------------------------------------------------------
-- 5. 거버넌스 데이터: 기업·본사 단위 핵심 지표 3개
-- -------------------------------------------------------------------------
WITH company_row AS (
    SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1
), headquarters AS (
    SELECT id
    FROM company_facilities
    WHERE company_id = (SELECT id FROM company_row)
      AND facility_type = 'HQ'
    ORDER BY id
    LIMIT 1
), manager_row AS (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
), periods AS (
    SELECT 2024 AS reporting_year, generate_series(1, 12) AS month_no
    UNION ALL
    SELECT 2025, generate_series(1, 12)
    UNION ALL
    SELECT 2026, generate_series(1, 5)
), governance_values AS (
    SELECT p.reporting_year,
           p.month_no,
           indicator_row.indicator_code,
           CASE indicator_row.indicator_code
               WHEN 'IND_G_ATTENDANCE' THEN LEAST(100.00, 84.0 + ((p.reporting_year - 2024) * 3.0) + (p.month_no * 0.65))
               WHEN 'IND_G_OUTSIDE' THEN 37.5 + ((p.reporting_year - 2024) * 2.5)
               WHEN 'IND_G_ETHICS_EDU' THEN LEAST(100.00, 88.0 + ((p.reporting_year - 2024) * 2.8) + (p.month_no * 0.55))
           END::NUMERIC(18,4) AS metric_value
    FROM periods p
    CROSS JOIN (VALUES
        ('IND_G_ATTENDANCE'),
        ('IND_G_OUTSIDE'),
        ('IND_G_ETHICS_EDU')
    ) AS indicator_row(indicator_code)
)
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT (SELECT id FROM company_row),
       (SELECT id FROM headquarters),
       i.id,
       g.reporting_year,
       'MONTHLY',
       g.month_no,
       ROUND(g.metric_value, 4),
       NULL,
       'DRAFT',
       'DEMO',
       (SELECT id FROM manager_row),
       NULL,
       jsonb_build_object(
           'migrationVersion', 'V8',
           'registrationMethod', 'DEMO_HISTORY',
           'scope', 'COMPANY',
           'workflowSeed', 'DRAFT_TO_APPROVED'
       ),
       make_timestamptz(g.reporting_year, g.month_no, 20, 9, 40, 0, 'Asia/Seoul'),
       make_timestamptz(g.reporting_year, g.month_no, 20, 9, 40, 0, 'Asia/Seoul')
FROM governance_values g
JOIN esg_indicators i ON i.indicator_code = g.indicator_code;

-- -------------------------------------------------------------------------
-- 6. 실제 업무 흐름과 같은 DRAFT → PENDING → APPROVED 상태 전이
-- -------------------------------------------------------------------------
CREATE TEMP TABLE v8_metric_timeline ON COMMIT DROP AS
SELECT m.id AS metric_id,
       m.created_at,
       m.created_at + INTERVAL '1 day 2 hour' AS requested_at,
       m.created_at + INTERVAL '2 day 6 hour' AS approved_at
FROM esg_metric_data m
JOIN companies c ON c.id = m.company_id
WHERE c.business_number = '123-45-67890'
  AND m.additional_info ->> 'migrationVersion' = 'V8';

UPDATE esg_metric_data m
SET status = 'PENDING',
    approver_user_id = NULL,
    updated_at = timeline.requested_at
FROM v8_metric_timeline timeline
WHERE m.id = timeline.metric_id;

UPDATE esg_metric_data m
SET status = 'APPROVED',
    approver_user_id = admin.id,
    reject_reason = NULL,
    updated_at = timeline.approved_at
FROM v8_metric_timeline timeline
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
) admin
WHERE m.id = timeline.metric_id;

-- 트리거가 마이그레이션 실행 시각으로 생성한 로그를 제거하고,
-- 실제 생성·요청·승인 시각에 맞는 스냅샷을 아래에서 다시 적재한다.
DELETE FROM audit_logs
WHERE table_name = 'esg_metric_data'
  AND record_id IN (SELECT metric_id FROM v8_metric_timeline);

-- 승인 이력: 생성, 승인 요청, 최종 승인
INSERT INTO esg_approval_history (
    metric_data_id, action_type, from_status, to_status, comment, actor_user_id, acted_at
)
SELECT timeline.metric_id,
       'CREATE',
       NULL,
       'DRAFT',
       '기업 ESG 관리자가 월별 ESG 실적과 증빙 대상 정보를 등록했습니다.',
       manager.id,
       timeline.created_at
FROM v8_metric_timeline timeline
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO esg_approval_history (
    metric_data_id, action_type, from_status, to_status, comment, actor_user_id, acted_at
)
SELECT timeline.metric_id,
       'REQUEST_APPROVAL',
       'DRAFT',
       'PENDING',
       '등록값과 월별 근거자료를 검토하여 최종 승인을 요청했습니다.',
       manager.id,
       timeline.requested_at
FROM v8_metric_timeline timeline
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO esg_approval_history (
    metric_data_id, action_type, from_status, to_status, comment, actor_user_id, acted_at
)
SELECT timeline.metric_id,
       'APPROVE',
       'PENDING',
       'APPROVED',
       '지표값, 출하액 및 승인 요청 내용을 확인하여 최종 승인했습니다.',
       admin.id,
       timeline.approved_at
FROM v8_metric_timeline timeline
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
) admin;

-- 감사 로그: INSERT(DRAFT), UPDATE(PENDING), UPDATE(APPROVED)
INSERT INTO audit_logs (
    user_id, action_type, table_name, record_id, old_values, new_values, performed_at
)
SELECT manager.id,
       'INSERT',
       'esg_metric_data',
       m.id,
       NULL,
       to_jsonb(m) || jsonb_build_object(
           'status', 'DRAFT',
           'approver_user_id', NULL,
           'updated_at', timeline.created_at
       ),
       timeline.created_at
FROM esg_metric_data m
JOIN v8_metric_timeline timeline ON timeline.metric_id = m.id
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO audit_logs (
    user_id, action_type, table_name, record_id, old_values, new_values, performed_at
)
SELECT manager.id,
       'UPDATE',
       'esg_metric_data',
       m.id,
       to_jsonb(m) || jsonb_build_object(
           'status', 'DRAFT',
           'approver_user_id', NULL,
           'updated_at', timeline.created_at
       ),
       to_jsonb(m) || jsonb_build_object(
           'status', 'PENDING',
           'approver_user_id', NULL,
           'updated_at', timeline.requested_at
       ),
       timeline.requested_at
FROM esg_metric_data m
JOIN v8_metric_timeline timeline ON timeline.metric_id = m.id
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
) manager;

INSERT INTO audit_logs (
    user_id, action_type, table_name, record_id, old_values, new_values, performed_at
)
SELECT admin.id,
       'UPDATE',
       'esg_metric_data',
       m.id,
       to_jsonb(m) || jsonb_build_object(
           'status', 'PENDING',
           'approver_user_id', NULL,
           'updated_at', timeline.requested_at
       ),
       to_jsonb(m) || jsonb_build_object(
           'status', 'APPROVED',
           'approver_user_id', admin.id,
           'updated_at', timeline.approved_at
       ),
       timeline.approved_at
FROM esg_metric_data m
JOIN v8_metric_timeline timeline ON timeline.metric_id = m.id
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
) admin;

-- -------------------------------------------------------------------------
-- 7. 연도·월별 내부 ESG 관리지수
-- -------------------------------------------------------------------------
WITH periods AS (
    SELECT 2024 AS reporting_year, generate_series(1, 12) AS month_no
    UNION ALL
    SELECT 2025, generate_series(1, 12)
    UNION ALL
    SELECT 2026, generate_series(1, 5)
), score_values AS (
    SELECT reporting_year,
           month_no,
           LEAST(96.00, 70.00 + ((reporting_year - 2024) * 5.50) + (month_no * 0.85))::NUMERIC(5,2) AS e_score,
           LEAST(97.00, 74.00 + ((reporting_year - 2024) * 4.80) + (month_no * 0.78))::NUMERIC(5,2) AS s_score,
           LEAST(98.00, 78.00 + ((reporting_year - 2024) * 4.20) + (month_no * 0.70))::NUMERIC(5,2) AS g_score
    FROM periods
), weighted AS (
    SELECT reporting_year,
           month_no,
           e_score,
           s_score,
           g_score,
           ROUND((e_score * 0.40) + (s_score * 0.35) + (g_score * 0.25), 2) AS total_score
    FROM score_values
)
INSERT INTO esg_scores (
    company_id, reporting_year, reporting_period, period_value,
    total_score, e_score, s_score, g_score, calculated_at
)
SELECT c.id,
       w.reporting_year,
       'MONTHLY',
       w.month_no,
       w.total_score,
       w.e_score,
       w.s_score,
       w.g_score,
       make_timestamptz(w.reporting_year, w.month_no, 22, 16, 0, 0, 'Asia/Seoul')
FROM companies c
CROSS JOIN weighted w
WHERE c.business_number = '123-45-67890'
ON CONFLICT (company_id, reporting_year, reporting_period, period_value) DO UPDATE
SET total_score = EXCLUDED.total_score,
    e_score = EXCLUDED.e_score,
    s_score = EXCLUDED.s_score,
    g_score = EXCLUDED.g_score,
    calculated_at = EXCLUDED.calculated_at;
