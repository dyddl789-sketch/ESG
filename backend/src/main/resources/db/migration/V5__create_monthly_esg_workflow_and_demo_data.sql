-- =========================================================================
-- [Flyway V5] ESG 직접 등록·승인·조회 통합 구조 및 시연 데이터
-- 2026년 1~5월: 최종 승인 완료(APPROVED)
-- 2026년 6월: 데이터 미생성 — 사업장별 ESG PDF 직접 등록 시연용
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. 기업·사업장·사용자·ESG 지표 기준정보 정리
-- -------------------------------------------------------------------------
INSERT INTO industry_types (code, name, description)
VALUES ('AUTO_PARTS', '자동차 부품 제조업', '가상의 수출형 중견 자동차 부품 제조기업')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO companies (
    name, industry_code, company_scale, business_number, representative_name,
    foreign_worker_count, turnover_rate
)
SELECT '에코모빌리티 파츠 주식회사', 'AUTO_PARTS', '중견기업', '123-45-67890', '김대표', 42, 6.80
WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE business_number = '123-45-67890'
);

UPDATE companies
SET name = '에코모빌리티 파츠 주식회사',
    industry_code = 'AUTO_PARTS',
    company_scale = '중견기업',
    representative_name = '김대표'
WHERE business_number = '123-45-67890';

-- V2의 본사 명칭을 최종 화면 용어로 통일한다.
UPDATE company_facilities
SET facility_name = '서울 본사',
    facility_type = 'HQ',
    contract_power_kw = 500,
    facility_center = ST_SetSRID(ST_MakePoint(126.9780, 37.5665), 4326),
    address = '서울특별시 중구 세종대로 110'
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND facility_name IN ('본사', '서울본사');

INSERT INTO company_facilities (
    company_id, facility_name, facility_type, contract_power_kw, facility_center, address
)
SELECT c.id, values_row.facility_name, values_row.facility_type,
       values_row.contract_power_kw,
       ST_SetSRID(ST_MakePoint(values_row.longitude, values_row.latitude), 4326),
       values_row.address
FROM companies c
CROSS JOIN (VALUES
    ('서울 본사', 'HQ',      500, 126.9780::NUMERIC, 37.5665::NUMERIC, '서울특별시 중구 세종대로 110'),
    ('부산공장',  'FACTORY', 4800, 128.9795::NUMERIC, 35.0951::NUMERIC, '부산광역시 강서구 녹산산업중로 120'),
    ('울산공장',  'FACTORY', 4200, 129.3114::NUMERIC, 35.5384::NUMERIC, '울산광역시 남구 산업로 210')
) AS values_row(facility_name, facility_type, contract_power_kw, longitude, latitude, address)
WHERE c.business_number = '123-45-67890'
  AND NOT EXISTS (
      SELECT 1
      FROM company_facilities f
      WHERE f.company_id = c.id
        AND f.facility_name = values_row.facility_name
  );

-- 시연 환경은 본사와 2개 공장으로 통일한다.
DELETE FROM company_facilities
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND facility_name NOT IN ('서울 본사', '부산공장', '울산공장');

-- 사업장 기준 부서를 다시 구성한다.
DELETE FROM departments
WHERE facility_id IN (
    SELECT id
    FROM company_facilities
    WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
);

INSERT INTO departments (facility_id, dept_name)
SELECT id, '플랫폼운영팀' FROM company_facilities WHERE facility_name = '서울 본사'
UNION ALL
SELECT id, '지속가능경영팀' FROM company_facilities WHERE facility_name = '서울 본사'
UNION ALL
SELECT id, '환경안전팀' FROM company_facilities WHERE facility_name IN ('부산공장', '울산공장');

INSERT INTO esg_indicators (
    category, sub_category, indicator_code, title, value_type, description, unit
)
VALUES
    ('ENVIRONMENT', '에너지', 'IND_E_ELEC', '전력 사용량', 'QUANTITATIVE', '사업장별 월간 전력 사용량', 'kWh'),
    ('ENVIRONMENT', '온실가스', 'IND_E_SCOPE2', 'Scope 2 온실가스 배출량', 'QUANTITATIVE', '구매 전력 기반 간접 온실가스 배출량', 'tCO2eq'),
    ('SOCIAL', '산업안전', 'IND_S_INJURY_RATE', '산업재해율', 'QUANTITATIVE', '평균 근로자 대비 산업재해자 비율', '%'),
    ('SOCIAL', '교육', 'IND_S_SAFETY_EDU', '안전교육 이수율', 'QUANTITATIVE', '대상자 대비 안전교육 이수 인원 비율', '%'),
    ('SOCIAL', '위험관리', 'IND_S_RISK_ACTION', '위험요인 개선 조치율', 'QUANTITATIVE', '확인된 위험요인 중 조치 완료 비율', '%'),
    ('SOCIAL', '인사', 'IND_S_TURNOVER', '퇴사율', 'QUANTITATIVE', '평균 재직자 대비 퇴사자 비율', '%'),
    ('GOVERNANCE', '이사회', 'IND_G_ATTENDANCE', '이사회 참석률', 'QUANTITATIVE', '개최 이사회 기준 이사 참석률', '%'),
    ('GOVERNANCE', '이사회', 'IND_G_OUTSIDE', '사외이사 비율', 'QUANTITATIVE', '전체 이사 중 사외이사 비율', '%'),
    ('GOVERNANCE', '윤리', 'IND_G_ETHICS_EDU', '윤리교육 이수율', 'QUANTITATIVE', '대상자 대비 윤리교육 이수 인원 비율', '%')
ON CONFLICT (indicator_code) DO UPDATE
SET category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    unit = EXCLUDED.unit,
    is_active = TRUE;

INSERT INTO emission_factors (
    energy_type, factor_value, factor_unit, reference_year, source, is_active
)
VALUES ('ELECTRICITY_KR', 0.459400, 'tCO2eq/MWh', 2026, '국가 온실가스 배출계수 시연값', TRUE)
ON CONFLICT (energy_type, reference_year) DO UPDATE
SET factor_value = EXCLUDED.factor_value,
    factor_unit = EXCLUDED.factor_unit,
    source = EXCLUDED.source,
    is_active = TRUE;

-- 시연 계정 비밀번호: Demo!1234
INSERT INTO users (
    company_id, department_id, login_id, email, password_hash, name, role,
    social_provider, is_active, token_version, email_verified, email_verified_at
)
SELECT c.id, d.id, 'systemadmin', 'admin@ecoflow.co.kr',
       crypt('Demo!1234', gen_salt('bf', 12)), '박시스템', 'SYSTEM_ADMIN',
       'LOCAL', TRUE, 0, TRUE, CURRENT_TIMESTAMP
FROM companies c
JOIN company_facilities f ON f.company_id = c.id AND f.facility_name = '서울 본사'
JOIN departments d ON d.facility_id = f.id AND d.dept_name = '플랫폼운영팀'
WHERE c.business_number = '123-45-67890'
ON CONFLICT (login_id) DO UPDATE
SET company_id = EXCLUDED.company_id,
    department_id = EXCLUDED.department_id,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    social_provider = EXCLUDED.social_provider,
    is_active = TRUE,
    email_verified = TRUE,
    email_verified_at = CURRENT_TIMESTAMP;

INSERT INTO users (
    company_id, department_id, login_id, email, password_hash, name, role,
    social_provider, is_active, token_version, email_verified, email_verified_at
)
SELECT c.id, d.id, 'esgmanager', 'manager@ecoflow.co.kr',
       crypt('Demo!1234', gen_salt('bf', 12)), '김ESG', 'COMPANY_MANAGER',
       'LOCAL', TRUE, 0, TRUE, CURRENT_TIMESTAMP
FROM companies c
JOIN company_facilities f ON f.company_id = c.id AND f.facility_name = '서울 본사'
JOIN departments d ON d.facility_id = f.id AND d.dept_name = '지속가능경영팀'
WHERE c.business_number = '123-45-67890'
ON CONFLICT (login_id) DO UPDATE
SET company_id = EXCLUDED.company_id,
    department_id = EXCLUDED.department_id,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    social_provider = EXCLUDED.social_provider,
    is_active = TRUE,
    email_verified = TRUE,
    email_verified_at = CURRENT_TIMESTAMP;

INSERT INTO users (
    company_id, department_id, login_id, email, password_hash, name, role,
    social_provider, is_active, token_version, email_verified, email_verified_at
)
VALUES (
    NULL, NULL, 'externaluser', 'external@example.com',
    crypt('Demo!1234', gen_salt('bf', 12)), '이투자', 'EXTERNAL_USER',
    'LOCAL', TRUE, 0, TRUE, CURRENT_TIMESTAMP
)
ON CONFLICT (login_id) DO UPDATE
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    social_provider = EXCLUDED.social_provider,
    is_active = TRUE,
    email_verified = TRUE,
    email_verified_at = CURRENT_TIMESTAMP;

-- -------------------------------------------------------------------------
-- 2. ESG 승인 이력 및 내부 평가 설정
-- -------------------------------------------------------------------------
CREATE TABLE esg_approval_history (
    id BIGSERIAL PRIMARY KEY,
    metric_data_id BIGINT NOT NULL REFERENCES esg_metric_data(id) ON DELETE CASCADE,
    action_type VARCHAR(30) NOT NULL,
    from_status data_status_enum,
    to_status data_status_enum NOT NULL,
    comment TEXT,
    actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    acted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE esg_evaluation_configs (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    evaluation_name VARCHAR(200) NOT NULL,
    evaluation_version VARCHAR(100) NOT NULL,
    disclaimer TEXT NOT NULL,
    environment_weight DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
    social_weight DECIMAL(5, 2) NOT NULL DEFAULT 35.00,
    governance_weight DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, reporting_year)
);

CREATE UNIQUE INDEX uq_esg_metric_natural_key
    ON esg_metric_data (
        company_id, facility_id, indicator_id,
        reporting_year, period_type, period_value
    ) NULLS NOT DISTINCT;

CREATE INDEX idx_esg_approval_history_metric
    ON esg_approval_history (metric_data_id, acted_at DESC);

CREATE INDEX idx_esg_metric_approved_lookup
    ON esg_metric_data (company_id, reporting_year, period_value, status, facility_id);

INSERT INTO esg_evaluation_configs (
    company_id, reporting_year, evaluation_name, evaluation_version, disclaimer,
    environment_weight, social_weight, governance_weight
)
SELECT c.id, 2026,
       'KCGS 평가체계 준용 내부 ESG 지수',
       '2026 내부관리 기준 v1.0',
       '본 지수는 당사의 개선활동 관리를 위한 자체 산정 결과이며 외부 ESG 평가기관의 공식 등급이 아닙니다.',
       40.00, 35.00, 25.00
FROM companies c
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
-- 3. 2026년 1~5월 최종 승인 데이터 생성
--    6월 데이터는 만들지 않는다.
-- -------------------------------------------------------------------------
DELETE FROM esg_scores
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND reporting_year = 2026;

DELETE FROM esg_metric_data
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND reporting_year = 2026;

-- 환경: 본사·부산공장·울산공장별 전력 사용량
WITH company_row AS (
    SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1
), manager_row AS (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
), admin_row AS (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
), months AS (
    SELECT generate_series(1, 5) AS month_no
), facilities AS (
    SELECT id, facility_name
    FROM company_facilities
    WHERE company_id = (SELECT id FROM company_row)
), electricity AS (
    SELECT f.id AS facility_id, f.facility_name, m.month_no,
           CASE f.facility_name
               WHEN '서울 본사' THEN 128000 - (m.month_no * 1600)
               WHEN '부산공장' THEN 468000 - (m.month_no * 6200)
               ELSE 412000 - (m.month_no * 5100)
           END::NUMERIC(18,4) AS usage_kwh
    FROM facilities f
    CROSS JOIN months m
)
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT (SELECT id FROM company_row), e.facility_id, i.id, 2026, 'MONTHLY', e.month_no,
       e.usage_kwh, NULL, 'APPROVED', 'MANUAL',
       (SELECT id FROM manager_row), (SELECT id FROM admin_row),
       jsonb_build_object(
           'registrationMethod', 'DEMO_APPROVED',
           'facilityName', e.facility_name,
           'approvedSeed', TRUE
       ),
       make_timestamptz(2026, e.month_no, 25, 9, 0, 0, 'Asia/Seoul'),
       make_timestamptz(2026, e.month_no, 26, 15, 0, 0, 'Asia/Seoul')
FROM electricity e
JOIN esg_indicators i ON i.indicator_code = 'IND_E_ELEC';

-- 환경: Scope 2 = 전력 사용량(kWh) / 1000 × 0.4594
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, emission_factor_id, additional_info, created_at, updated_at
)
SELECT e.company_id, e.facility_id, scope_indicator.id, e.reporting_year, e.period_type, e.period_value,
       ROUND((e.numerical_value / 1000.0) * factor.factor_value, 4),
       NULL, 'APPROVED', 'CALCULATION', e.input_user_id, e.approver_user_id,
       factor.factor_id,
       jsonb_build_object(
           'registrationMethod', 'DEMO_APPROVED',
           'formula', '전력 사용량(kWh) / 1000 × 배출계수',
           'approvedSeed', TRUE
       ),
       e.created_at, e.updated_at
FROM esg_metric_data e
JOIN esg_indicators electricity_indicator
  ON electricity_indicator.id = e.indicator_id
 AND electricity_indicator.indicator_code = 'IND_E_ELEC'
JOIN esg_indicators scope_indicator
  ON scope_indicator.indicator_code = 'IND_E_SCOPE2'
JOIN emission_factors factor
  ON factor.energy_type = 'ELECTRICITY_KR'
 AND factor.reference_year = 2026
WHERE e.reporting_year = 2026
  AND e.period_value BETWEEN 1 AND 5;

-- 사회: 각 사업장별 핵심지표 4개
WITH company_row AS (
    SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1
), manager_row AS (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
), admin_row AS (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
), months AS (
    SELECT generate_series(1, 5) AS month_no
), facilities AS (
    SELECT id, facility_name
    FROM company_facilities
    WHERE company_id = (SELECT id FROM company_row)
), social_values AS (
    SELECT f.id AS facility_id, f.facility_name, m.month_no, values_row.indicator_code,
           CASE values_row.indicator_code
               WHEN 'IND_S_INJURY_RATE' THEN
                   CASE f.facility_name WHEN '서울 본사' THEN 0.00 ELSE 0.24 - (m.month_no * 0.018) END
               WHEN 'IND_S_SAFETY_EDU' THEN
                   CASE f.facility_name WHEN '서울 본사' THEN 96.0 ELSE 91.0 + (m.month_no * 1.1) END
               WHEN 'IND_S_RISK_ACTION' THEN
                   CASE f.facility_name WHEN '서울 본사' THEN 98.0 ELSE 83.0 + (m.month_no * 2.2) END
               WHEN 'IND_S_TURNOVER' THEN
                   CASE f.facility_name WHEN '서울 본사' THEN 0.8 ELSE 2.8 - (m.month_no * 0.18) END
           END::NUMERIC(18,4) AS metric_value
    FROM facilities f
    CROSS JOIN months m
    CROSS JOIN (VALUES
        ('IND_S_INJURY_RATE'),
        ('IND_S_SAFETY_EDU'),
        ('IND_S_RISK_ACTION'),
        ('IND_S_TURNOVER')
    ) AS values_row(indicator_code)
)
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT (SELECT id FROM company_row), s.facility_id, i.id, 2026, 'MONTHLY', s.month_no,
       ROUND(s.metric_value, 4), NULL, 'APPROVED', 'MANUAL',
       (SELECT id FROM manager_row), (SELECT id FROM admin_row),
       jsonb_build_object(
           'registrationMethod', 'DEMO_APPROVED',
           'facilityName', s.facility_name,
           'approvedSeed', TRUE
       ),
       make_timestamptz(2026, s.month_no, 25, 9, 10, 0, 'Asia/Seoul'),
       make_timestamptz(2026, s.month_no, 26, 15, 10, 0, 'Asia/Seoul')
FROM social_values s
JOIN esg_indicators i ON i.indicator_code = s.indicator_code;

-- 거버넌스: 기업·본사 단위 핵심지표 3개
WITH company_row AS (
    SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1
), headquarters AS (
    SELECT id FROM company_facilities
    WHERE company_id = (SELECT id FROM company_row) AND facility_type = 'HQ'
    ORDER BY id LIMIT 1
), manager_row AS (
    SELECT id FROM users WHERE login_id = 'esgmanager' LIMIT 1
), admin_row AS (
    SELECT id FROM users WHERE login_id = 'systemadmin' LIMIT 1
), months AS (
    SELECT generate_series(1, 5) AS month_no
), governance_values AS (
    SELECT m.month_no, values_row.indicator_code,
           CASE values_row.indicator_code
               WHEN 'IND_G_ATTENDANCE' THEN 89.0 + (m.month_no * 1.4)
               WHEN 'IND_G_OUTSIDE' THEN 37.5
               WHEN 'IND_G_ETHICS_EDU' THEN 93.0 + (m.month_no * 1.1)
           END::NUMERIC(18,4) AS metric_value
    FROM months m
    CROSS JOIN (VALUES
        ('IND_G_ATTENDANCE'),
        ('IND_G_OUTSIDE'),
        ('IND_G_ETHICS_EDU')
    ) AS values_row(indicator_code)
)
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT (SELECT id FROM company_row), (SELECT id FROM headquarters), i.id,
       2026, 'MONTHLY', g.month_no, ROUND(g.metric_value, 4), NULL,
       'APPROVED', 'MANUAL',
       (SELECT id FROM manager_row), (SELECT id FROM admin_row),
       jsonb_build_object(
           'registrationMethod', 'DEMO_APPROVED',
           'scope', 'COMPANY',
           'approvedSeed', TRUE
       ),
       make_timestamptz(2026, g.month_no, 25, 9, 20, 0, 'Asia/Seoul'),
       make_timestamptz(2026, g.month_no, 26, 15, 20, 0, 'Asia/Seoul')
FROM governance_values g
JOIN esg_indicators i ON i.indicator_code = g.indicator_code;

-- 모든 시연 지표에 승인 요청·최종 승인 이력을 생성한다.
INSERT INTO esg_approval_history (
    metric_data_id, action_type, from_status, to_status, comment, actor_user_id, acted_at
)
SELECT m.id, 'REQUEST_APPROVAL', 'DRAFT', 'PENDING',
       '사업장 ESG 등록값과 증빙자료를 확인하여 최종 승인을 요청했습니다.',
       manager.id, m.updated_at - INTERVAL '2 hour'
FROM esg_metric_data m
JOIN users manager ON manager.login_id = 'esgmanager'
WHERE m.reporting_year = 2026
  AND m.period_value BETWEEN 1 AND 5
  AND m.status = 'APPROVED';

INSERT INTO esg_approval_history (
    metric_data_id, action_type, from_status, to_status, comment, actor_user_id, acted_at
)
SELECT m.id, 'APPROVE', 'PENDING', 'APPROVED',
       '등록값과 증빙자료를 확인하여 최종 승인했습니다.',
       admin.id, m.updated_at
FROM esg_metric_data m
JOIN users admin ON admin.login_id = 'systemadmin'
WHERE m.reporting_year = 2026
  AND m.period_value BETWEEN 1 AND 5
  AND m.status = 'APPROVED';

-- -------------------------------------------------------------------------
-- 4. 1~5월 내부 ESG 지수 생성
-- -------------------------------------------------------------------------
INSERT INTO esg_scores (
    company_id, reporting_year, reporting_period, period_value,
    total_score, e_score, s_score, g_score, calculated_at
)
SELECT c.id, 2026, 'MONTHLY', score_row.month_no,
       score_row.total_score, score_row.e_score, score_row.s_score, score_row.g_score,
       make_timestamptz(2026, score_row.month_no, 26, 16, 0, 0, 'Asia/Seoul')
FROM companies c
CROSS JOIN (VALUES
    (1, 78.30::NUMERIC, 75.20::NUMERIC, 79.10::NUMERIC, 82.10::NUMERIC),
    (2, 80.10::NUMERIC, 77.80::NUMERIC, 80.40::NUMERIC, 83.30::NUMERIC),
    (3, 82.00::NUMERIC, 80.10::NUMERIC, 82.10::NUMERIC, 85.00::NUMERIC),
    (4, 84.20::NUMERIC, 82.80::NUMERIC, 84.00::NUMERIC, 86.70::NUMERIC),
    (5, 86.10::NUMERIC, 85.20::NUMERIC, 85.70::NUMERIC, 88.10::NUMERIC)
) AS score_row(month_no, total_score, e_score, s_score, g_score)
WHERE c.business_number = '123-45-67890'
ON CONFLICT (company_id, reporting_year, reporting_period, period_value) DO UPDATE
SET total_score = EXCLUDED.total_score,
    e_score = EXCLUDED.e_score,
    s_score = EXCLUDED.s_score,
    g_score = EXCLUDED.g_score,
    calculated_at = EXCLUDED.calculated_at;

-- 감사 로그 화면에서 1~5월 최종 승인 이력을 확인할 수 있도록 승인 스냅샷을 생성한다.
INSERT INTO audit_logs (
    user_id, action_type, table_name, record_id, old_values, new_values, performed_at
)
SELECT admin.id, 'UPDATE', 'esg_metric_data', m.id,
       jsonb_build_object(
           'id', m.id,
           'status', 'PENDING',
           'input_user_id', m.input_user_id,
           'indicator_id', m.indicator_id,
           'facility_id', m.facility_id,
           'reporting_year', m.reporting_year,
           'period_type', m.period_type,
           'period_value', m.period_value,
           'numerical_value', m.numerical_value
       ),
       to_jsonb(m),
       m.updated_at
FROM esg_metric_data m
JOIN users admin ON admin.login_id = 'systemadmin'
WHERE m.reporting_year = 2026
  AND m.period_value BETWEEN 1 AND 5
  AND m.status = 'APPROVED';
