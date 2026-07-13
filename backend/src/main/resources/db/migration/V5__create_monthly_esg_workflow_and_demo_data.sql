-- =========================================================================
-- [Flyway V5] 월별 ESG 수집·반영·AI 분석·승인·대시보드 시연 데이터
-- 2026년 1~5월: 최종 승인 완료 / 2026년 6월: 수집 완료·미반영
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. 삭제된 기준정보 복구 및 사업장 3개 표준화
-- -------------------------------------------------------------------------
INSERT INTO industry_types (code, name, description)
VALUES ('AUTO_PARTS', '자동차 부품 제조업', '가상의 수출형 중견 자동차 부품 제조기업')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO companies (
    id, name, industry_code, company_scale, business_number, representative_name,
    foreign_worker_count, turnover_rate
)
SELECT
    1, '에코모빌리티 파츠 주식회사', 'AUTO_PARTS', '중견기업', '123-45-67890', '김대표', 42, 6.80
WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE id = 1 OR business_number = '123-45-67890'
);

SELECT setval(
    pg_get_serial_sequence('companies', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM companies), 1),
    TRUE
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies WHERE id = 1) THEN
        RAISE EXCEPTION '시연 기업 ID 1을 생성하지 못했습니다. companies 테이블의 기존 데이터를 확인해 주세요.';
    END IF;
END $$;

UPDATE companies
SET name = '에코모빌리티 파츠 주식회사',
    industry_code = 'AUTO_PARTS',
    company_scale = '중견기업',
    representative_name = '김대표'
WHERE business_number = '123-45-67890';

-- V2에서 생성된 본사를 서울 본사로 표준화한다.
UPDATE company_facilities
SET facility_name = '서울 본사',
    facility_type = 'HQ',
    contract_power_kw = 500,
    facility_center = ST_SetSRID(ST_MakePoint(126.9780, 37.5665), 4326),
    address = '서울특별시 중구 세종대로 110'
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND facility_name = '본사';

INSERT INTO company_facilities (
    company_id, facility_name, facility_type, contract_power_kw, facility_center, address
)
SELECT c.id, '서울 본사', 'HQ', 500,
       ST_SetSRID(ST_MakePoint(126.9780, 37.5665), 4326),
       '서울특별시 중구 세종대로 110'
FROM companies c
WHERE c.business_number = '123-45-67890'
  AND NOT EXISTS (
      SELECT 1 FROM company_facilities f
      WHERE f.company_id = c.id AND f.facility_name = '서울 본사'
  );

INSERT INTO company_facilities (
    company_id, facility_name, facility_type, contract_power_kw, facility_center, address
)
SELECT c.id, '부산공장', 'FACTORY', 4800,
       ST_SetSRID(ST_MakePoint(128.9795, 35.0951), 4326),
       '부산광역시 강서구 녹산산업중로 120'
FROM companies c
WHERE c.business_number = '123-45-67890'
  AND NOT EXISTS (
      SELECT 1 FROM company_facilities f
      WHERE f.company_id = c.id AND f.facility_name = '부산공장'
  );

INSERT INTO company_facilities (
    company_id, facility_name, facility_type, contract_power_kw, facility_center, address
)
SELECT c.id, '울산공장', 'FACTORY', 4200,
       ST_SetSRID(ST_MakePoint(129.3114, 35.5384), 4326),
       '울산광역시 남구 산업로 210'
FROM companies c
WHERE c.business_number = '123-45-67890'
  AND NOT EXISTS (
      SELECT 1 FROM company_facilities f
      WHERE f.company_id = c.id AND f.facility_name = '울산공장'
  );

-- 최종 사업장 3개 외의 기존 사업장은 제거한다.
DELETE FROM company_facilities
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND facility_name NOT IN ('서울 본사', '부산공장', '울산공장');

-- 기존 부서가 삭제되었거나 사업장 구성이 달라졌을 수 있으므로 시연 기준으로 재구성한다.
DELETE FROM departments
WHERE facility_id IN (
    SELECT id FROM company_facilities
    WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
);

INSERT INTO departments (facility_id, dept_name)
SELECT id, '플랫폼운영팀' FROM company_facilities WHERE facility_name = '서울 본사'
UNION ALL
SELECT id, '지속가능경영팀' FROM company_facilities WHERE facility_name = '서울 본사'
UNION ALL
SELECT id, '환경안전팀' FROM company_facilities WHERE facility_name IN ('부산공장', '울산공장');

-- 지표 기준정보 복구
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

-- 시연 계정 복구. 비밀번호: Demo!1234
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
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    social_provider = EXCLUDED.social_provider,
    company_id = EXCLUDED.company_id,
    department_id = EXCLUDED.department_id,
    role = EXCLUDED.role,
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
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    social_provider = EXCLUDED.social_provider,
    company_id = EXCLUDED.company_id,
    department_id = EXCLUDED.department_id,
    role = EXCLUDED.role,
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
    social_provider = EXCLUDED.social_provider,
    role = EXCLUDED.role,
    is_active = TRUE,
    email_verified = TRUE,
    email_verified_at = CURRENT_TIMESTAMP;

-- -------------------------------------------------------------------------
-- 2. 수집·반영·AI·승인 업무 테이블
-- -------------------------------------------------------------------------
CREATE TABLE integration_runs (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    domain VARCHAR(20) NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    base_period VARCHAR(7) NOT NULL,
    trigger_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    total_count INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    CONSTRAINT ck_integration_runs_domain CHECK (domain IN ('ENVIRONMENT', 'SOCIAL', 'GOVERNANCE')),
    CONSTRAINT ck_integration_runs_trigger CHECK (trigger_type IN ('SCHEDULED', 'DEMO', 'RETRY')),
    CONSTRAINT ck_integration_runs_status CHECK (status IN ('PROCESSING', 'SUCCESS', 'FAILED'))
);

CREATE TABLE environment_monthly_data (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id INT NOT NULL REFERENCES company_facilities(id) ON DELETE CASCADE,
    base_period VARCHAR(7) NOT NULL,
    electricity_usage_kwh DECIMAL(18, 4) NOT NULL DEFAULT 0,
    production_ton DECIMAL(18, 4) NOT NULL DEFAULT 0,
    intensity_kwh_per_ton DECIMAL(18, 4),
    emission_factor DECIMAL(12, 7) NOT NULL,
    scope2_tco2eq DECIMAL(18, 4),
    validation_status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    collection_status VARCHAR(20) NOT NULL DEFAULT 'COLLECTED',
    reflection_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REFLECTED',
    approval_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reflected_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (facility_id, base_period),
    CONSTRAINT ck_environment_validation CHECK (validation_status IN ('NORMAL', 'REVIEW', 'ERROR')),
    CONSTRAINT ck_environment_collection CHECK (collection_status IN ('NOT_COLLECTED', 'COLLECTED', 'FAILED')),
    CONSTRAINT ck_environment_reflection CHECK (reflection_status IN ('NOT_REFLECTED', 'REFLECTED')),
    CONSTRAINT ck_environment_approval CHECK (approval_status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE social_monthly_data (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id INT NOT NULL REFERENCES company_facilities(id) ON DELETE CASCADE,
    base_period VARCHAR(7) NOT NULL,
    average_employees INT NOT NULL DEFAULT 0,
    exit_count INT NOT NULL DEFAULT 0,
    injured_employee_count INT NOT NULL DEFAULT 0,
    total_work_hours DECIMAL(18, 2) NOT NULL DEFAULT 0,
    training_target_count INT NOT NULL DEFAULT 0,
    training_completed_count INT NOT NULL DEFAULT 0,
    hazard_total_count INT NOT NULL DEFAULT 0,
    hazard_completed_count INT NOT NULL DEFAULT 0,
    injury_rate DECIMAL(12, 4),
    training_completion_rate DECIMAL(8, 4),
    hazard_action_rate DECIMAL(8, 4),
    turnover_rate DECIMAL(8, 4),
    validation_status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    collection_status VARCHAR(20) NOT NULL DEFAULT 'COLLECTED',
    reflection_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REFLECTED',
    approval_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reflected_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (facility_id, base_period),
    CONSTRAINT ck_social_validation CHECK (validation_status IN ('NORMAL', 'REVIEW', 'ERROR')),
    CONSTRAINT ck_social_collection CHECK (collection_status IN ('NOT_COLLECTED', 'COLLECTED', 'FAILED')),
    CONSTRAINT ck_social_reflection CHECK (reflection_status IN ('NOT_REFLECTED', 'REFLECTED')),
    CONSTRAINT ck_social_approval CHECK (approval_status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE governance_monthly_data (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    headquarters_facility_id INT REFERENCES company_facilities(id) ON DELETE SET NULL,
    base_period VARCHAR(7) NOT NULL,
    board_meeting_status VARCHAR(20) NOT NULL DEFAULT 'NOT_HELD',
    board_meeting_count INT NOT NULL DEFAULT 0,
    total_director_seats INT NOT NULL DEFAULT 0,
    attended_director_seats INT NOT NULL DEFAULT 0,
    total_directors INT NOT NULL DEFAULT 0,
    outside_directors INT NOT NULL DEFAULT 0,
    ethics_target_count INT NOT NULL DEFAULT 0,
    ethics_completed_count INT NOT NULL DEFAULT 0,
    board_attendance_rate DECIMAL(8, 4),
    outside_director_rate DECIMAL(8, 4),
    ethics_completion_rate DECIMAL(8, 4),
    validation_status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    collection_status VARCHAR(20) NOT NULL DEFAULT 'COLLECTED',
    reflection_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REFLECTED',
    approval_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reflected_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, base_period),
    CONSTRAINT ck_governance_meeting CHECK (board_meeting_status IN ('HELD', 'NOT_HELD')),
    CONSTRAINT ck_governance_validation CHECK (validation_status IN ('NORMAL', 'REVIEW', 'ERROR')),
    CONSTRAINT ck_governance_collection CHECK (collection_status IN ('NOT_COLLECTED', 'COLLECTED', 'FAILED')),
    CONSTRAINT ck_governance_reflection CHECK (reflection_status IN ('NOT_REFLECTED', 'REFLECTED')),
    CONSTRAINT ck_governance_approval CHECK (approval_status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE integration_raw_data (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT REFERENCES integration_runs(id) ON DELETE SET NULL,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id INT REFERENCES company_facilities(id) ON DELETE CASCADE,
    domain VARCHAR(20) NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    source_record_id VARCHAR(120) NOT NULL,
    base_period VARCHAR(7) NOT NULL,
    payload JSONB NOT NULL,
    validation_status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    error_message TEXT,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, source_system, source_record_id),
    CONSTRAINT ck_raw_data_domain CHECK (domain IN ('ENVIRONMENT', 'SOCIAL', 'GOVERNANCE')),
    CONSTRAINT ck_raw_data_validation CHECK (validation_status IN ('NORMAL', 'REVIEW', 'ERROR'))
);

CREATE TABLE esg_ai_analyses (
    id BIGSERIAL PRIMARY KEY,
    metric_data_id BIGINT NOT NULL UNIQUE REFERENCES esg_metric_data(id) ON DELETE CASCADE,
    analysis_status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    risk_level VARCHAR(20),
    summary TEXT,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_name VARCHAR(100),
    analyzed_by INT REFERENCES users(id) ON DELETE SET NULL,
    analyzed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_ai_analysis_status CHECK (analysis_status IN ('WAITING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT ck_ai_risk_level CHECK (risk_level IS NULL OR risk_level IN ('LOW', 'MEDIUM', 'HIGH'))
);

CREATE TABLE esg_approval_history (
    id BIGSERIAL PRIMARY KEY,
    metric_data_id BIGINT NOT NULL REFERENCES esg_metric_data(id) ON DELETE CASCADE,
    action_type VARCHAR(30) NOT NULL,
    from_status data_status_enum,
    to_status data_status_enum NOT NULL,
    comment TEXT,
    actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    acted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_approval_action CHECK (action_type IN ('REFLECT', 'AI_ANALYSIS', 'REQUEST_APPROVAL', 'APPROVE', 'REJECT', 'RESUBMIT'))
);

CREATE TABLE esg_evaluation_configs (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    config_code VARCHAR(80) NOT NULL,
    config_name VARCHAR(255) NOT NULL,
    reference_framework VARCHAR(100) NOT NULL,
    version VARCHAR(30) NOT NULL,
    effective_year INT NOT NULL,
    e_weight DECIMAL(5, 2) NOT NULL,
    s_weight DECIMAL(5, 2) NOT NULL,
    g_weight DECIMAL(5, 2) NOT NULL,
    indicator_rules JSONB NOT NULL,
    grade_thresholds JSONB NOT NULL,
    disclaimer TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, config_code, version)
);

CREATE UNIQUE INDEX uq_esg_metric_natural_key
    ON esg_metric_data (company_id, facility_id, indicator_id, reporting_year, period_type, period_value)
    NULLS NOT DISTINCT;
CREATE INDEX idx_integration_runs_lookup ON integration_runs (company_id, domain, base_period, started_at DESC);
CREATE INDEX idx_environment_monthly_lookup ON environment_monthly_data (company_id, base_period, facility_id);
CREATE INDEX idx_social_monthly_lookup ON social_monthly_data (company_id, base_period, facility_id);
CREATE INDEX idx_governance_monthly_lookup ON governance_monthly_data (company_id, base_period);
CREATE INDEX idx_integration_raw_lookup ON integration_raw_data (company_id, facility_id, domain, base_period);
CREATE INDEX idx_integration_raw_payload ON integration_raw_data USING gin (payload);
CREATE INDEX idx_approval_history_metric ON esg_approval_history (metric_data_id, acted_at DESC);

INSERT INTO esg_evaluation_configs (
    company_id, config_code, config_name, reference_framework, version, effective_year,
    e_weight, s_weight, g_weight, indicator_rules, grade_thresholds, disclaimer
)
SELECT
    c.id,
    'KCGS_ALIGNED_INTERNAL',
    'KCGS 평가체계 준용 내부 ESG 지수',
    'KCGS 평가체계 참고',
    '2026-V1',
    2026,
    40.00,
    35.00,
    25.00,
    '{
      "environment": {"electricityIntensityTarget": 82.0, "scope2ReductionTarget": 3.0},
      "social": {"injuryRateTarget": 0.20, "trainingRateTarget": 95.0, "hazardRateTarget": 90.0, "turnoverRateTarget": 2.0},
      "governance": {"boardAttendanceTarget": 90.0, "outsideDirectorTarget": 37.5, "ethicsRateTarget": 95.0}
    }'::jsonb,
    '{"S":90,"A+":85,"A":80,"B+":75,"B":65,"C":50,"D":0}'::jsonb,
    '본 지수와 추정등급은 KCGS의 공식 평가 결과가 아닌 내부 ESG 개선활동 관리를 위한 자체 산정값입니다.'
FROM companies c
WHERE c.business_number = '123-45-67890'
ON CONFLICT (company_id, config_code, version) DO NOTHING;

-- -------------------------------------------------------------------------
-- 3. 기존 시연 결과 정리 후 2026년 1~6월 월간 원천·집계 데이터 생성
-- -------------------------------------------------------------------------
DELETE FROM esg_scores
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND reporting_year = 2026;

DELETE FROM esg_metric_data
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1)
  AND reporting_year = 2026;

WITH months AS (
    SELECT month_no, FORMAT('2026-%s', LPAD(month_no::TEXT, 2, '0')) AS base_period
    FROM generate_series(1, 6) AS month_no
), facilities AS (
    SELECT f.*, ROW_NUMBER() OVER (ORDER BY CASE f.facility_type WHEN 'HQ' THEN 0 ELSE 1 END, f.id) AS facility_order
    FROM company_facilities f
    JOIN companies c ON c.id = f.company_id
    WHERE c.business_number = '123-45-67890'
)
INSERT INTO environment_monthly_data (
    company_id, facility_id, base_period, electricity_usage_kwh, production_ton,
    intensity_kwh_per_ton, emission_factor, scope2_tco2eq,
    validation_status, collection_status, reflection_status, approval_status,
    collected_at, reflected_at, approved_at, updated_at
)
SELECT
    f.company_id,
    f.id,
    m.base_period,
    CASE f.facility_name
        WHEN '서울 본사' THEN 47000 + m.month_no * 1700
        WHEN '부산공장' THEN 382000 + m.month_no * 7750
        WHEN '울산공장' THEN 341000 + m.month_no * 6900
    END::DECIMAL(18,4),
    CASE f.facility_name
        WHEN '서울 본사' THEN 580 + m.month_no * 10
        WHEN '부산공장' THEN 5030 + m.month_no * 75
        WHEN '울산공장' THEN 4410 + m.month_no * 68
    END::DECIMAL(18,4),
    ROUND((CASE f.facility_name
        WHEN '서울 본사' THEN 47000 + m.month_no * 1700
        WHEN '부산공장' THEN 382000 + m.month_no * 7750
        WHEN '울산공장' THEN 341000 + m.month_no * 6900
    END)::NUMERIC / NULLIF((CASE f.facility_name
        WHEN '서울 본사' THEN 580 + m.month_no * 10
        WHEN '부산공장' THEN 5030 + m.month_no * 75
        WHEN '울산공장' THEN 4410 + m.month_no * 68
    END), 0), 4),
    0.0004594,
    ROUND((CASE f.facility_name
        WHEN '서울 본사' THEN 47000 + m.month_no * 1700
        WHEN '부산공장' THEN 382000 + m.month_no * 7750
        WHEN '울산공장' THEN 341000 + m.month_no * 6900
    END) * 0.0004594, 4),
    'NORMAL', 'COLLECTED',
    CASE WHEN m.month_no <= 5 THEN 'REFLECTED' ELSE 'NOT_REFLECTED' END,
    CASE WHEN m.month_no <= 5 THEN 'APPROVED' ELSE 'DRAFT' END,
    MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 1, 3, 0, 0, 'Asia/Seoul'),
    CASE WHEN m.month_no <= 5 THEN MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 2, 10, 0, 0, 'Asia/Seoul') END,
    CASE WHEN m.month_no <= 5 THEN MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 5, 14, 0, 0, 'Asia/Seoul') END,
    CURRENT_TIMESTAMP
FROM months m CROSS JOIN facilities f;

WITH months AS (
    SELECT month_no, FORMAT('2026-%s', LPAD(month_no::TEXT, 2, '0')) AS base_period
    FROM generate_series(1, 6) AS month_no
), facilities AS (
    SELECT f.*
    FROM company_facilities f
    JOIN companies c ON c.id = f.company_id
    WHERE c.business_number = '123-45-67890'
)
INSERT INTO social_monthly_data (
    company_id, facility_id, base_period, average_employees, exit_count,
    injured_employee_count, total_work_hours, training_target_count,
    training_completed_count, hazard_total_count, hazard_completed_count,
    injury_rate, training_completion_rate, hazard_action_rate, turnover_rate,
    validation_status, collection_status, reflection_status, approval_status,
    collected_at, reflected_at, approved_at, updated_at
)
SELECT
    f.company_id,
    f.id,
    m.base_period,
    CASE f.facility_name WHEN '서울 본사' THEN 238 WHEN '부산공장' THEN 412 ELSE 328 END,
    CASE f.facility_name WHEN '서울 본사' THEN 2 + MOD(m.month_no, 2)
                         WHEN '부산공장' THEN 5 + MOD(m.month_no, 3)
                         ELSE 4 + MOD(m.month_no, 2) END,
    CASE WHEN (f.facility_name = '부산공장' AND m.month_no = 3)
               OR (f.facility_name = '울산공장' AND m.month_no = 5) THEN 1 ELSE 0 END,
    CASE f.facility_name WHEN '서울 본사' THEN 37200 WHEN '부산공장' THEN 64100 ELSE 51500 END,
    CASE f.facility_name WHEN '서울 본사' THEN 238 WHEN '부산공장' THEN 412 ELSE 328 END,
    CASE f.facility_name WHEN '서울 본사' THEN 228 + m.month_no
                         WHEN '부산공장' THEN 386 + m.month_no * 2
                         ELSE 307 + m.month_no * 2 END,
    CASE f.facility_name WHEN '서울 본사' THEN 5 + m.month_no
                         WHEN '부산공장' THEN 10 + m.month_no
                         ELSE 8 + m.month_no END,
    CASE f.facility_name WHEN '서울 본사' THEN 4 + m.month_no
                         WHEN '부산공장' THEN 8 + m.month_no
                         ELSE 7 + m.month_no END,
    ROUND((CASE WHEN (f.facility_name = '부산공장' AND m.month_no = 3)
                      OR (f.facility_name = '울산공장' AND m.month_no = 5) THEN 1 ELSE 0 END)
          * 100.0 / NULLIF(CASE f.facility_name WHEN '서울 본사' THEN 238 WHEN '부산공장' THEN 412 ELSE 328 END, 0), 4),
    ROUND((CASE f.facility_name WHEN '서울 본사' THEN 228 + m.month_no
                               WHEN '부산공장' THEN 386 + m.month_no * 2
                               ELSE 307 + m.month_no * 2 END)
          * 100.0 / NULLIF(CASE f.facility_name WHEN '서울 본사' THEN 238 WHEN '부산공장' THEN 412 ELSE 328 END, 0), 4),
    ROUND((CASE f.facility_name WHEN '서울 본사' THEN 4 + m.month_no
                               WHEN '부산공장' THEN 8 + m.month_no
                               ELSE 7 + m.month_no END)
          * 100.0 / NULLIF(CASE f.facility_name WHEN '서울 본사' THEN 5 + m.month_no
                                                WHEN '부산공장' THEN 10 + m.month_no
                                                ELSE 8 + m.month_no END, 0), 4),
    ROUND((CASE f.facility_name WHEN '서울 본사' THEN 2 + MOD(m.month_no, 2)
                               WHEN '부산공장' THEN 5 + MOD(m.month_no, 3)
                               ELSE 4 + MOD(m.month_no, 2) END)
          * 100.0 / NULLIF(CASE f.facility_name WHEN '서울 본사' THEN 238 WHEN '부산공장' THEN 412 ELSE 328 END, 0), 4),
    'NORMAL', 'COLLECTED',
    CASE WHEN m.month_no <= 5 THEN 'REFLECTED' ELSE 'NOT_REFLECTED' END,
    CASE WHEN m.month_no <= 5 THEN 'APPROVED' ELSE 'DRAFT' END,
    MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 1, 3, 10, 0, 'Asia/Seoul'),
    CASE WHEN m.month_no <= 5 THEN MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 2, 10, 10, 0, 'Asia/Seoul') END,
    CASE WHEN m.month_no <= 5 THEN MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 5, 14, 10, 0, 'Asia/Seoul') END,
    CURRENT_TIMESTAMP
FROM months m CROSS JOIN facilities f;

WITH months AS (
    SELECT month_no, FORMAT('2026-%s', LPAD(month_no::TEXT, 2, '0')) AS base_period
    FROM generate_series(1, 6) AS month_no
), company_info AS (
    SELECT c.id AS company_id,
           (SELECT f.id FROM company_facilities f WHERE f.company_id = c.id AND f.facility_name = '서울 본사' LIMIT 1) AS headquarters_id
    FROM companies c WHERE c.business_number = '123-45-67890'
)
INSERT INTO governance_monthly_data (
    company_id, headquarters_facility_id, base_period, board_meeting_status,
    board_meeting_count, total_director_seats, attended_director_seats,
    total_directors, outside_directors, ethics_target_count, ethics_completed_count,
    board_attendance_rate, outside_director_rate, ethics_completion_rate,
    validation_status, collection_status, reflection_status, approval_status,
    collected_at, reflected_at, approved_at, updated_at
)
SELECT
    ci.company_id,
    ci.headquarters_id,
    m.base_period,
    CASE WHEN m.month_no IN (1, 3, 5, 6) THEN 'HELD' ELSE 'NOT_HELD' END,
    CASE WHEN m.month_no IN (1, 3, 5, 6) THEN 1 ELSE 0 END,
    CASE WHEN m.month_no IN (1, 3, 5, 6) THEN 8 ELSE 0 END,
    CASE WHEN m.month_no IN (1, 3, 5, 6) THEN CASE WHEN m.month_no = 6 THEN 7 ELSE 8 END ELSE 0 END,
    8,
    3,
    1250,
    1185 + m.month_no * 8,
    CASE WHEN m.month_no IN (1, 3, 5, 6)
         THEN CASE WHEN m.month_no = 6 THEN 87.5000 ELSE 100.0000 END END,
    37.5000,
    ROUND((1185 + m.month_no * 8) * 100.0 / 1250, 4),
    'NORMAL', 'COLLECTED',
    CASE WHEN m.month_no <= 5 THEN 'REFLECTED' ELSE 'NOT_REFLECTED' END,
    CASE WHEN m.month_no <= 5 THEN 'APPROVED' ELSE 'DRAFT' END,
    MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 1, 3, 20, 0, 'Asia/Seoul'),
    CASE WHEN m.month_no <= 5 THEN MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 2, 10, 20, 0, 'Asia/Seoul') END,
    CASE WHEN m.month_no <= 5 THEN MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 5, 14, 20, 0, 'Asia/Seoul') END,
    CURRENT_TIMESTAMP
FROM months m CROSS JOIN company_info ci;

-- 월별 수집 실행 이력
WITH months AS (
    SELECT month_no, FORMAT('2026-%s', LPAD(month_no::TEXT, 2, '0')) AS base_period
    FROM generate_series(1, 6) AS month_no
), domains(domain, source_system, total_count, minute_offset) AS (
    VALUES ('ENVIRONMENT', 'EMS', 3, 0), ('SOCIAL', 'HR_SAFETY', 3, 10), ('GOVERNANCE', 'GROUPWARE', 1, 20)
), company_info AS (
    SELECT id FROM companies WHERE business_number = '123-45-67890'
)
INSERT INTO integration_runs (
    company_id, domain, source_system, base_period, trigger_type, status,
    total_count, success_count, error_count, started_at, completed_at
)
SELECT
    c.id, d.domain, d.source_system, m.base_period, 'SCHEDULED', 'SUCCESS',
    d.total_count, d.total_count, 0,
    MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 1, 3, d.minute_offset, 0, 'Asia/Seoul'),
    MAKE_TIMESTAMPTZ(2026, m.month_no + 1, 1, 3, d.minute_offset + 2, 0, 'Asia/Seoul')
FROM months m CROSS JOIN domains d CROSS JOIN company_info c;

-- 환경 원천 데이터
INSERT INTO integration_raw_data (
    run_id, company_id, facility_id, domain, source_system, source_record_id,
    base_period, payload, validation_status, collected_at
)
SELECT
    r.id, e.company_id, e.facility_id, 'ENVIRONMENT', 'EMS',
    'EMS-' || e.facility_id || '-' || REPLACE(e.base_period, '-', ''),
    e.base_period,
    jsonb_build_object(
        'electricityUsageKwh', e.electricity_usage_kwh,
        'productionTon', e.production_ton,
        'unit', 'kWh',
        'meterId', 'METER-' || LPAD(e.facility_id::TEXT, 4, '0')
    ),
    e.validation_status,
    e.collected_at
FROM environment_monthly_data e
JOIN integration_runs r ON r.company_id = e.company_id AND r.domain = 'ENVIRONMENT' AND r.base_period = e.base_period;

-- 사회 원천 데이터
INSERT INTO integration_raw_data (
    run_id, company_id, facility_id, domain, source_system, source_record_id,
    base_period, payload, validation_status, collected_at
)
SELECT
    r.id, s.company_id, s.facility_id, 'SOCIAL', 'HR_SAFETY',
    'SOCIAL-' || s.facility_id || '-' || REPLACE(s.base_period, '-', ''),
    s.base_period,
    jsonb_build_object(
        'averageEmployees', s.average_employees,
        'exitCount', s.exit_count,
        'injuredEmployeeCount', s.injured_employee_count,
        'trainingTargetCount', s.training_target_count,
        'trainingCompletedCount', s.training_completed_count,
        'hazardTotalCount', s.hazard_total_count,
        'hazardCompletedCount', s.hazard_completed_count
    ),
    s.validation_status,
    s.collected_at
FROM social_monthly_data s
JOIN integration_runs r ON r.company_id = s.company_id AND r.domain = 'SOCIAL' AND r.base_period = s.base_period;

-- 거버넌스 원천 데이터
INSERT INTO integration_raw_data (
    run_id, company_id, facility_id, domain, source_system, source_record_id,
    base_period, payload, validation_status, collected_at
)
SELECT
    r.id, g.company_id, g.headquarters_facility_id, 'GOVERNANCE', 'GROUPWARE',
    'GOV-' || REPLACE(g.base_period, '-', ''),
    g.base_period,
    jsonb_build_object(
        'boardMeetingStatus', g.board_meeting_status,
        'boardMeetingCount', g.board_meeting_count,
        'totalDirectors', g.total_directors,
        'outsideDirectors', g.outside_directors,
        'ethicsTargetCount', g.ethics_target_count,
        'ethicsCompletedCount', g.ethics_completed_count
    ),
    g.validation_status,
    g.collected_at
FROM governance_monthly_data g
JOIN integration_runs r ON r.company_id = g.company_id AND r.domain = 'GOVERNANCE' AND r.base_period = g.base_period;

-- -------------------------------------------------------------------------
-- 4. 1~5월 ESG 반영·최종 승인 데이터 생성
-- -------------------------------------------------------------------------
-- 환경: 전력 사용량
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    activity_value, numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT
    e.company_id, e.facility_id, i.id, 2026, 'MONTHLY', SUBSTRING(e.base_period, 6, 2)::INT,
    e.electricity_usage_kwh, e.electricity_usage_kwh,
    '/demo/evidence/' || REPLACE(e.base_period, '-', '') || '_electricity.pdf',
    'APPROVED', 'API', manager.id, admin.id,
    jsonb_build_object(
        'basePeriod', e.base_period,
        'sourceSystem', 'EMS',
        'productionTon', e.production_ton,
        'intensityKwhPerTon', e.intensity_kwh_per_ton,
        'reflectionStatus', 'REFLECTED',
        'evaluationType', 'KCGS_ALIGNED_INTERNAL'
    ),
    e.reflected_at, e.approved_at
FROM environment_monthly_data e
JOIN esg_indicators i ON i.indicator_code = 'IND_E_ELEC'
JOIN users manager ON manager.login_id = 'esgmanager'
JOIN users admin ON admin.login_id = 'systemadmin'
WHERE e.base_period <= '2026-05';

-- 환경: Scope 2
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    activity_value, numerical_value, emission_factor_id, evidence_file_url, status,
    data_source_type, input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT
    e.company_id, e.facility_id, i.id, 2026, 'MONTHLY', SUBSTRING(e.base_period, 6, 2)::INT,
    e.electricity_usage_kwh, e.scope2_tco2eq, ef.factor_id,
    '/demo/evidence/' || REPLACE(e.base_period, '-', '') || '_scope2.pdf',
    'APPROVED', 'CALCULATION', manager.id, admin.id,
    jsonb_build_object(
        'basePeriod', e.base_period,
        'sourceSystem', 'EMS',
        'formula', '전력 사용량 × 전력 배출계수',
        'emissionFactor', e.emission_factor,
        'reflectionStatus', 'REFLECTED',
        'evaluationType', 'KCGS_ALIGNED_INTERNAL'
    ),
    e.reflected_at, e.approved_at
FROM environment_monthly_data e
JOIN esg_indicators i ON i.indicator_code = 'IND_E_SCOPE2'
JOIN emission_factors ef ON ef.energy_type = 'ELECTRICITY_KR' AND ef.reference_year = 2026
JOIN users manager ON manager.login_id = 'esgmanager'
JOIN users admin ON admin.login_id = 'systemadmin'
WHERE e.base_period <= '2026-05';

-- 사회 4개 지표
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    activity_value, numerical_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT
    s.company_id, s.facility_id, i.id, 2026, 'MONTHLY', SUBSTRING(s.base_period, 6, 2)::INT,
    CASE i.indicator_code
        WHEN 'IND_S_INJURY_RATE' THEN s.injured_employee_count
        WHEN 'IND_S_SAFETY_EDU' THEN s.training_completed_count
        WHEN 'IND_S_RISK_ACTION' THEN s.hazard_completed_count
        WHEN 'IND_S_TURNOVER' THEN s.exit_count
    END,
    CASE i.indicator_code
        WHEN 'IND_S_INJURY_RATE' THEN s.injury_rate
        WHEN 'IND_S_SAFETY_EDU' THEN s.training_completion_rate
        WHEN 'IND_S_RISK_ACTION' THEN s.hazard_action_rate
        WHEN 'IND_S_TURNOVER' THEN s.turnover_rate
    END,
    '/demo/evidence/' || REPLACE(s.base_period, '-', '') || '_social.xlsx',
    'APPROVED', 'CALCULATION', manager.id, admin.id,
    jsonb_build_object(
        'basePeriod', s.base_period,
        'sourceSystem', 'HR_SAFETY',
        'averageEmployees', s.average_employees,
        'trainingTargetCount', s.training_target_count,
        'hazardTotalCount', s.hazard_total_count,
        'reflectionStatus', 'REFLECTED',
        'evaluationType', 'KCGS_ALIGNED_INTERNAL'
    ),
    s.reflected_at, s.approved_at
FROM social_monthly_data s
CROSS JOIN esg_indicators i
JOIN users manager ON manager.login_id = 'esgmanager'
JOIN users admin ON admin.login_id = 'systemadmin'
WHERE s.base_period <= '2026-05'
  AND i.indicator_code IN ('IND_S_INJURY_RATE', 'IND_S_SAFETY_EDU', 'IND_S_RISK_ACTION', 'IND_S_TURNOVER');

-- 거버넌스 3개 지표. 이사회 미개최 월은 text_value로 구분한다.
INSERT INTO esg_metric_data (
    company_id, facility_id, indicator_id, reporting_year, period_type, period_value,
    activity_value, numerical_value, text_value, evidence_file_url, status, data_source_type,
    input_user_id, approver_user_id, additional_info, created_at, updated_at
)
SELECT
    g.company_id, g.headquarters_facility_id, i.id, 2026, 'MONTHLY', SUBSTRING(g.base_period, 6, 2)::INT,
    CASE i.indicator_code
        WHEN 'IND_G_ATTENDANCE' THEN g.attended_director_seats
        WHEN 'IND_G_OUTSIDE' THEN g.outside_directors
        WHEN 'IND_G_ETHICS_EDU' THEN g.ethics_completed_count
    END,
    CASE i.indicator_code
        WHEN 'IND_G_ATTENDANCE' THEN g.board_attendance_rate
        WHEN 'IND_G_OUTSIDE' THEN g.outside_director_rate
        WHEN 'IND_G_ETHICS_EDU' THEN g.ethics_completion_rate
    END,
    CASE WHEN i.indicator_code = 'IND_G_ATTENDANCE' AND g.board_meeting_status = 'NOT_HELD'
         THEN '이사회 미개최' END,
    '/demo/evidence/' || REPLACE(g.base_period, '-', '') || '_governance.pdf',
    'APPROVED',
    CASE WHEN i.indicator_code = 'IND_G_ATTENDANCE' THEN 'DOCUMENT_AI' ELSE 'API' END,
    manager.id, admin.id,
    jsonb_build_object(
        'basePeriod', g.base_period,
        'sourceSystem', 'GROUPWARE',
        'boardMeetingStatus', g.board_meeting_status,
        'reflectionStatus', 'REFLECTED',
        'evaluationType', 'KCGS_ALIGNED_INTERNAL'
    ),
    g.reflected_at, g.approved_at
FROM governance_monthly_data g
CROSS JOIN esg_indicators i
JOIN users manager ON manager.login_id = 'esgmanager'
JOIN users admin ON admin.login_id = 'systemadmin'
WHERE g.base_period <= '2026-05'
  AND i.indicator_code IN ('IND_G_ATTENDANCE', 'IND_G_OUTSIDE', 'IND_G_ETHICS_EDU');

-- 승인 완료 데이터의 AI 분석 및 승인 이력
INSERT INTO esg_ai_analyses (
    metric_data_id, analysis_status, risk_level, summary, findings,
    model_name, analyzed_by, analyzed_at, updated_at
)
SELECT
    m.id,
    'COMPLETED',
    CASE WHEN m.numerical_value IS NULL THEN 'LOW' ELSE 'LOW' END,
    CASE
        WHEN m.text_value = '이사회 미개최' THEN '해당 월은 이사회 미개최로 확인되며, 0% 성과로 평가하지 않았습니다.'
        ELSE '원천값, 산정식, 단위 및 증빙 연결 상태를 확인했습니다. 특이 이상치는 발견되지 않았습니다.'
    END,
    jsonb_build_array('원천 레코드 연결 확인', '단위 및 필수값 검증', '월별 변동 검토'),
    'ESG-RULE-FALLBACK-1.0',
    manager.id,
    m.created_at + INTERVAL '1 hour',
    m.updated_at
FROM esg_metric_data m
JOIN users manager ON manager.login_id = 'esgmanager'
WHERE m.reporting_year = 2026 AND m.status = 'APPROVED';

INSERT INTO esg_approval_history (
    metric_data_id, action_type, from_status, to_status, comment, actor_user_id, acted_at
)
SELECT m.id, 'REFLECT', NULL::data_status_enum, 'DRAFT'::data_status_enum, '월간 원천 데이터를 ESG 지표로 반영했습니다.', manager.id, m.created_at
FROM esg_metric_data m
JOIN users manager ON manager.login_id = 'esgmanager'
WHERE m.reporting_year = 2026
UNION ALL
SELECT m.id, 'AI_ANALYSIS', 'DRAFT'::data_status_enum, 'DRAFT'::data_status_enum, 'AI 사전 분석을 완료했습니다.', manager.id, m.created_at + INTERVAL '1 hour'
FROM esg_metric_data m
JOIN users manager ON manager.login_id = 'esgmanager'
WHERE m.reporting_year = 2026
UNION ALL
SELECT m.id, 'REQUEST_APPROVAL', 'DRAFT'::data_status_enum, 'PENDING'::data_status_enum, '최종 승인을 요청했습니다.', manager.id, m.updated_at - INTERVAL '2 hour'
FROM esg_metric_data m
JOIN users manager ON manager.login_id = 'esgmanager'
WHERE m.reporting_year = 2026
UNION ALL
SELECT m.id, 'APPROVE', 'PENDING'::data_status_enum, 'APPROVED'::data_status_enum, '원천값과 AI 분석 결과를 확인하여 최종 승인했습니다.', admin.id, m.updated_at
FROM esg_metric_data m
JOIN users admin ON admin.login_id = 'systemadmin'
WHERE m.reporting_year = 2026;

-- KCGS 평가체계 준용 내부 지수: 승인 완료된 실제 월간값으로 1~5월 산정
WITH environment_values AS (
    SELECT
        company_id,
        base_period,
        SUM(electricity_usage_kwh) AS electricity_usage_kwh,
        SUM(production_ton) AS production_ton,
        SUM(scope2_tco2eq) AS scope2_tco2eq
    FROM environment_monthly_data
    WHERE base_period <= '2026-05' AND approval_status = 'APPROVED'
    GROUP BY company_id, base_period
), environment_scored AS (
    SELECT
        company_id,
        base_period,
        LEAST(100.0, CASE
            WHEN electricity_usage_kwh / NULLIF(production_ton, 0) <= 82.0 THEN 100.0
            ELSE 82.0 / NULLIF(electricity_usage_kwh / NULLIF(production_ton, 0), 0) * 100.0
        END) AS intensity_score,
        CASE
            WHEN LAG(scope2_tco2eq) OVER (PARTITION BY company_id ORDER BY base_period) IS NULL THEN 80.0
            ELSE LEAST(100.0, GREATEST(0.0,
                ((LAG(scope2_tco2eq) OVER (PARTITION BY company_id ORDER BY base_period) - scope2_tco2eq)
                 / NULLIF(LAG(scope2_tco2eq) OVER (PARTITION BY company_id ORDER BY base_period), 0)
                 * 100.0) / 3.0 * 100.0
            ))
        END AS reduction_score
    FROM environment_values
), social_values AS (
    SELECT
        company_id,
        base_period,
        AVG(injury_rate) AS injury_rate,
        AVG(training_completion_rate) AS training_completion_rate,
        AVG(hazard_action_rate) AS hazard_action_rate,
        AVG(turnover_rate) AS turnover_rate
    FROM social_monthly_data
    WHERE base_period <= '2026-05' AND approval_status = 'APPROVED'
    GROUP BY company_id, base_period
), score_components AS (
    SELECT
        e.company_id,
        e.base_period,
        (e.intensity_score * 0.50 + e.reduction_score * 0.50) AS e_score,
        (
            (CASE WHEN s.injury_rate <= 0.20 THEN 100.0 ELSE LEAST(100.0, 0.20 / NULLIF(s.injury_rate, 0) * 100.0) END) * 10.0
          + LEAST(100.0, s.training_completion_rate / 95.0 * 100.0) * 10.0
          + LEAST(100.0, s.hazard_action_rate / 90.0 * 100.0) * 10.0
          + (CASE WHEN s.turnover_rate <= 2.0 THEN 100.0 ELSE LEAST(100.0, 2.0 / NULLIF(s.turnover_rate, 0) * 100.0) END) * 5.0
        ) / 35.0 AS s_score,
        (
            (CASE WHEN g.board_attendance_rate IS NULL THEN 100.0 ELSE LEAST(100.0, g.board_attendance_rate / 90.0 * 100.0) END) * 40.0
          + LEAST(100.0, g.outside_director_rate / 37.5 * 100.0) * 20.0
          + LEAST(100.0, g.ethics_completion_rate / 95.0 * 100.0) * 40.0
        ) / 100.0 AS g_score
    FROM environment_scored e
    JOIN social_values s ON s.company_id = e.company_id AND s.base_period = e.base_period
    JOIN governance_monthly_data g ON g.company_id = e.company_id AND g.base_period = e.base_period
    WHERE g.approval_status = 'APPROVED'
)
INSERT INTO esg_scores (
    company_id, reporting_year, reporting_period, period_value,
    total_score, e_score, s_score, g_score, calculated_at
)
SELECT
    company_id,
    SUBSTRING(base_period, 1, 4)::INT,
    'MONTHLY',
    SUBSTRING(base_period, 6, 2)::INT,
    ROUND((e_score * 0.40 + s_score * 0.35 + g_score * 0.25)::NUMERIC, 2),
    ROUND(e_score::NUMERIC, 2),
    ROUND(s_score::NUMERIC, 2),
    ROUND(g_score::NUMERIC, 2),
    MAKE_TIMESTAMPTZ(2026, SUBSTRING(base_period, 6, 2)::INT + 1, 5, 14, 30, 0, 'Asia/Seoul')
FROM score_components;
