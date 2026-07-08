-- 필수 기준정보와 로그인 시연 계정을 생성합니다.
-- 모든 비밀번호는 pgcrypto의 bcrypt 방식으로 해시되어 저장됩니다.

INSERT INTO industry_types (code, name, description)
VALUES ('AUTO_PARTS', '자동차 부품 제조업', '가상의 수출형 중견 자동차 부품 제조기업')
ON CONFLICT (code) DO NOTHING;

INSERT INTO companies (
    name,
    industry_code,
    company_scale,
    business_number,
    representative_name,
    foreign_worker_count,
    turnover_rate
)
VALUES (
    '에코모빌리티 파츠 주식회사',
    'AUTO_PARTS',
    '중견기업',
    '123-45-67890',
    '김대표',
    42,
    6.80
);

INSERT INTO company_facilities (
    company_id,
    facility_name,
    facility_type,
    contract_power_kw,
    facility_center,
    address
)
SELECT id, '본사', 'HQ', 500,
       ST_SetSRID(ST_MakePoint(129.0756, 35.1796), 4326),
       '부산광역시 연제구 중앙대로 1001'
  FROM companies
 WHERE name = '에코모빌리티 파츠 주식회사';

INSERT INTO company_facilities (
    company_id,
    facility_name,
    facility_type,
    contract_power_kw,
    facility_center,
    address
)
SELECT id, '부산공장', 'FACTORY', 4800,
       ST_SetSRID(ST_MakePoint(128.9795, 35.0951), 4326),
       '부산광역시 강서구 녹산산업중로 120'
  FROM companies
 WHERE name = '에코모빌리티 파츠 주식회사';

INSERT INTO company_facilities (
    company_id,
    facility_name,
    facility_type,
    contract_power_kw,
    facility_center,
    address
)
SELECT id, '울산공장', 'FACTORY', 4200,
       ST_SetSRID(ST_MakePoint(129.3114, 35.5384), 4326),
       '울산광역시 남구 산업로 210'
  FROM companies
 WHERE name = '에코모빌리티 파츠 주식회사';

INSERT INTO company_facilities (
    company_id,
    facility_name,
    facility_type,
    contract_power_kw,
    facility_center,
    address
)
SELECT id, '창원공장', 'FACTORY', 3900,
       ST_SetSRID(ST_MakePoint(128.6811, 35.2279), 4326),
       '경상남도 창원시 성산구 공단로 77'
  FROM companies
 WHERE name = '에코모빌리티 파츠 주식회사';

INSERT INTO departments (facility_id, dept_name)
SELECT id, '플랫폼운영팀'
  FROM company_facilities
 WHERE facility_name = '본사';

INSERT INTO departments (facility_id, dept_name)
SELECT id, '지속가능경영팀'
  FROM company_facilities
 WHERE facility_name = '본사';

INSERT INTO departments (facility_id, dept_name)
SELECT id, '환경안전팀'
  FROM company_facilities
 WHERE facility_name IN ('부산공장', '울산공장', '창원공장');

INSERT INTO common_codes (code_id, group_code, code_name, code_value, sort_order)
VALUES
    ('DATA_API', 'COLLECTION_METHOD', '외부 API 연동', 'API', 1),
    ('DATA_FILE', 'COLLECTION_METHOD', '파일 업로드', 'FILE_UPLOAD', 2),
    ('DATA_AI', 'COLLECTION_METHOD', '문서 AI 분석', 'DOCUMENT_AI', 3),
    ('DATA_CORRECTION', 'COLLECTION_METHOD', '예외 보정', 'MANUAL_CORRECTION', 4)
ON CONFLICT (code_id) DO NOTHING;

INSERT INTO esg_indicators (
    category, sub_category, indicator_code, title, value_type, description, unit
)
VALUES
    ('ENVIRONMENT', '에너지', 'IND_E_ELEC', '전력 사용량', 'QUANTITATIVE', '사업장별 월간 전력 사용량', 'kWh'),
    ('ENVIRONMENT', '온실가스', 'IND_E_SCOPE2', 'Scope 2 온실가스 배출량', 'QUANTITATIVE', '구매 전력 기반 간접 온실가스 배출량', 'tCO2eq'),
    ('SOCIAL', '산업안전', 'IND_S_INJURY_RATE', '산업재해율', 'QUANTITATIVE', '근로시간 대비 산업재해 발생 수준', '%'),
    ('SOCIAL', '교육', 'IND_S_SAFETY_EDU', '안전교육 이수율', 'QUANTITATIVE', '대상자 대비 안전교육 이수 인원 비율', '%'),
    ('SOCIAL', '위험관리', 'IND_S_RISK_ACTION', '위험요인 개선 조치율', 'QUANTITATIVE', '확인된 위험요인 중 조치 완료 비율', '%'),
    ('SOCIAL', '인사', 'IND_S_TURNOVER', '퇴사율', 'QUANTITATIVE', '평균 재직자 대비 퇴사자 비율', '%'),
    ('GOVERNANCE', '이사회', 'IND_G_ATTENDANCE', '이사회 참석률', 'QUANTITATIVE', '전체 이사 대비 회의 참석 비율', '%'),
    ('GOVERNANCE', '이사회', 'IND_G_OUTSIDE', '사외이사 비율', 'QUANTITATIVE', '전체 이사 중 사외이사 비율', '%'),
    ('GOVERNANCE', '윤리', 'IND_G_ETHICS_EDU', '윤리교육 이수율', 'QUANTITATIVE', '대상자 대비 윤리교육 이수 인원 비율', '%')
ON CONFLICT (indicator_code) DO NOTHING;

INSERT INTO emission_factors (
    energy_type, factor_value, factor_unit, reference_year, source, is_active
)
VALUES ('ELECTRICITY_KR', 0.459400, 'tCO2eq/MWh', 2026, '국가 온실가스 배출계수 시연값', TRUE)
ON CONFLICT (energy_type, reference_year) DO NOTHING;

-- 시연용 계정 비밀번호: Demo!1234
INSERT INTO users (
    company_id, department_id, login_id, email, password_hash, name, role,
    social_provider, is_active, token_version
)
SELECT
    c.id,
    d.id,
    'admin@ecoflow.co.kr',
    'admin@ecoflow.co.kr',
    crypt('Demo!1234', gen_salt('bf', 12)),
    '박시스템',
    'SYSTEM_ADMIN',
    'LOCAL',
    TRUE,
    0
FROM companies c
JOIN company_facilities f ON f.company_id = c.id AND f.facility_name = '본사'
JOIN departments d ON d.facility_id = f.id AND d.dept_name = '플랫폼운영팀'
WHERE c.name = '에코모빌리티 파츠 주식회사'
ON CONFLICT (login_id) DO NOTHING;

INSERT INTO users (
    company_id, department_id, login_id, email, password_hash, name, role,
    social_provider, is_active, token_version
)
SELECT
    c.id,
    d.id,
    'manager@ecoflow.co.kr',
    'manager@ecoflow.co.kr',
    crypt('Demo!1234', gen_salt('bf', 12)),
    '김ESG',
    'COMPANY_MANAGER',
    'LOCAL',
    TRUE,
    0
FROM companies c
JOIN company_facilities f ON f.company_id = c.id AND f.facility_name = '본사'
JOIN departments d ON d.facility_id = f.id AND d.dept_name = '지속가능경영팀'
WHERE c.name = '에코모빌리티 파츠 주식회사'
ON CONFLICT (login_id) DO NOTHING;

INSERT INTO users (
    company_id, department_id, login_id, email, password_hash, name, role,
    social_provider, is_active, token_version
)
VALUES (
    NULL,
    NULL,
    'external@example.com',
    'external@example.com',
    crypt('Demo!1234', gen_salt('bf', 12)),
    '이투자',
    'EXTERNAL_USER',
    'LOCAL',
    TRUE,
    0
)
ON CONFLICT (login_id) DO NOTHING;
