-- =========================================================================
-- ① 위치 기반 시각화 및 pgcrypto 암호화 검증을 위한 필수 확장 기능 활성화
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- ② 플랫폼 전반의 데이터 표준화 및 도메인 정합성을 위한 ENUM 타입 선언
-- =========================================================================
CREATE TYPE esg_category_enum AS ENUM ('ENVIRONMENT', 'SOCIAL', 'GOVERNANCE');
CREATE TYPE indicator_value_type_enum AS ENUM ('QUANTITATIVE', 'QUALITATIVE');
CREATE TYPE data_status_enum AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE user_role_enum AS ENUM ('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER');
CREATE TYPE collection_status_enum AS ENUM ('NORMAL', 'DELAYED', 'ERROR');
CREATE TYPE scope_type_enum AS ENUM ('SCOPE_1', 'SCOPE_2', 'SCOPE_3');
CREATE TYPE period_type_enum AS ENUM ('YEARLY', 'HALFYEARLY', 'QUARTERLY', 'MONTHLY');
CREATE TYPE kepco_contract_enum AS ENUM ('IND_A_I', 'IND_A_II', 'IND_B_I', 'IND_B_II', 'IND_B_III'); 
CREATE TYPE load_zone_enum AS ENUM ('LIGHT', 'MIDDLE', 'MAX_PEAK'); 
CREATE TYPE season_enum AS ENUM ('SPRING_AUTUMN', 'SUMMER', 'WINTER'); 

-- =========================================================================
-- ③ 시스템 유연성 및 현실 고증을 위한 인프라 마스터 테이블
-- =========================================================================

-- 대한민국 기업용 시스템의 정석: 공통 코드 테이블 (common_code)
CREATE TABLE common_codes (
    code_id VARCHAR(50) PRIMARY KEY,       -- 예: 'ENG_ELEC', 'DEPT_PROD'
    group_code VARCHAR(50) NOT NULL,       -- 예: 'ENERGY_TYPE', 'DEPT_TYPE'
    code_name VARCHAR(100) NOT NULL,       -- 예: '전력 (Electricity)', '생산부'
    code_value VARCHAR(100),               
    sort_order INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 업종 마스터 테이블 (industry_type)
CREATE TABLE industry_types (
    code VARCHAR(50) PRIMARY KEY,          -- 예: 'AUTO_PARTS'(자동차부품), 'METAL_FAB'(금속가공)
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 기업 정보 테이블 (company)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,            -- 가상 중견기업 명칭
    industry_code VARCHAR(50) NOT NULL REFERENCES industry_types(code),
    company_scale VARCHAR(50) NOT NULL,    -- 예: '중견기업'
    business_number VARCHAR(20),
    representative_name VARCHAR(100),
    logo_url VARCHAR(1024),
    foreign_worker_count INT DEFAULT 0,    -- [S영역 카드용] 외국인 근로자 수 현황
    turnover_rate DECIMAL(5, 2) DEFAULT 0.00, -- [S영역 차트용] 전사 이직률 트렌드
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사업장 공간 관리 테이블 (workplace / company_facility)
CREATE TABLE company_facilities (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_name VARCHAR(255) NOT NULL,    -- 예: '본사', '부산공장', '울산공장', '창원공장'
    facility_type VARCHAR(50) NOT NULL,    -- 예: 'HQ', 'FACTORY'
    contract_power_kw INT DEFAULT 0,       -- 한전 계약전력 (피크 경보 위젯 분모 데이터)
    facility_center GEOMETRY(Point, 4326), -- [지도 탭] 위도/경도 기반 구글/카카오맵 마커 핀 좌표
    address VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 공장별 세부 부서/공정 관리 테이블 (department)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    facility_id INT NOT NULL REFERENCES company_facilities(id) ON DELETE CASCADE, -- 어느 공장 소속인가
    dept_name VARCHAR(100) NOT NULL,       -- 예: '생산부(주조)', '생산부(도금)', '환경안전팀', '인사팀'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블: 로컬 로그인과 카카오 소셜 로그인을 함께 지원
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id) ON DELETE SET NULL,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    login_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),            -- LOCAL 계정은 BCrypt 해시, 소셜 전용 계정은 NULL 허용
    name VARCHAR(100) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'EXTERNAL_USER',
    phone_number VARCHAR(50),
    social_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
    social_id VARCHAR(255),
    profile_image_url VARCHAR(1024),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INT NOT NULL DEFAULT 0,  -- 비밀번호 변경/전체 로그아웃 시 기존 JWT 일괄 무효화
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_users_local_password
        CHECK (social_provider <> 'LOCAL' OR password_hash IS NOT NULL)
);
-- =========================================================================
-- ④ 무한한 차트/카드 확장을 지탱하는 ESG 평가지표 기준 정보 테이블
-- =========================================================================

-- ESG 평가지표 마스터 테이블 (esg_indicator)
CREATE TABLE esg_indicators (
    id SERIAL PRIMARY KEY,
    category esg_category_enum NOT NULL,    -- ENVIRONMENT, SOCIAL, GOVERNANCE
    sub_category VARCHAR(100) NOT NULL,    -- 예: '온실가스', '산업안전', '지배구조 투명성'
    indicator_code VARCHAR(50) UNIQUE NOT NULL, -- 예: 'IND_E_ELEC'(전력), 'IND_S_INJURY'(재해)
    title VARCHAR(255) NOT NULL,            -- 예: '전력 사용량', '산업재해 건수'
    value_type indicator_value_type_enum NOT NULL DEFAULT 'QUANTITATIVE',
    description TEXT,
    unit VARCHAR(50),                       -- 표준 기준 단위 (kWh, tCO2eq, 건, %, 명 등)
    is_active BOOLEAN DEFAULT TRUE
);

-- 업종별 필수 지표 및 권장 가중치 매핑 테이블 (industry_indicator_map)
CREATE TABLE industry_indicator_maps (
    id SERIAL PRIMARY KEY,
    industry_code VARCHAR(50) NOT NULL REFERENCES industry_types(code) ON DELETE CASCADE,
    indicator_id INT NOT NULL REFERENCES esg_indicators(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT TRUE,      -- 바이어 실사 시 필수 지표 여부
    weight DECIMAL(5, 2) DEFAULT 1.00,      -- 스코어 연산 시 업종별 가중치
    UNIQUE(industry_code, indicator_id)
);

-- =========================================================================
-- ⑤ 실제 한국전력 Open API 연동 규격 및 국가 표준 배출 계수 마스터
-- =========================================================================

-- 한전 산업용 전력 단가 마스터 테이블 (kepco_tariff_master)
CREATE TABLE kepco_tariff_master (
    id SERIAL PRIMARY KEY,
    contract_type kepco_contract_enum NOT NULL, -- 산업용(갑)I, 산업용(을)고압 등
    season season_enum NOT NULL,            -- 봄·가을, 여름, 겨울 구분
    load_zone load_zone_enum NOT NULL,      -- 경부하, 중부하, 최대부하 시간대 구분
    unit_price_krw DECIMAL(10, 2) NOT NULL, -- kWh당 실제 한국전력 요금 단가
    applied_year INT NOT NULL,              -- 요금제 적용 연도
    source_url VARCHAR(255) DEFAULT 'KEPCO_OPEN_API',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contract_type, season, load_zone, applied_year)
);

-- 국가 온실가스 표준 배출 계수 마스터 테이블 (emission_factor - 요청하신 규격 동기화)
CREATE TABLE emission_factors (
    factor_id SERIAL PRIMARY KEY,           -- factor_id 반영
    energy_type VARCHAR(100) NOT NULL,      -- energy_type 반영 (예: 'ELECTRICITY_KR', 'LNG')
    factor_value DECIMAL(12, 6) NOT NULL,  -- factor_value 반영
    factor_unit VARCHAR(50) NOT NULL,       -- factor_unit 반영 (예: 'tCO2eq/MWh')
    reference_year INT NOT NULL,            -- reference_year 반영 (적용 연도)
    source VARCHAR(100),                    -- source 반영 (출처: 환경부, NGMS 등)
    is_active BOOLEAN DEFAULT TRUE,         -- active 플래그 반영
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(energy_type, reference_year)
);
-- =========================================================================
-- ⑥ 더미데이터 적재 및 다양한 대시보드 차트 시각화의 원천이 되는 트랜잭션 테이블
-- =========================================================================

-- ESG 통합 측정 데이터 테이블 (esg_metric_data - 한전 API 환산 비용 및 암호화 무결성 서명 포함)
CREATE TABLE esg_metric_data (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id INT REFERENCES company_facilities(id) ON DELETE SET NULL, -- 본사, 부산, 울산, 창원공장 분기
    indicator_id INT NOT NULL REFERENCES esg_indicators(id) ON DELETE RESTRICT, -- 전력 사용량, 여성 관리자 비율 등 매핑
    reporting_year INT NOT NULL,
    period_type period_type_enum NOT NULL DEFAULT 'MONTHLY', -- 월별 시계열 차트 위젯을 위한 세팅
    period_value INT NOT NULL,               -- 1월 ~ 12월
    activity_value DECIMAL(18, 4),           -- 실제 고지서나 IoT로 입력한 전력량(kWh) 등 원본 수치
    energy_cost DECIMAL(18, 2),              -- [차트용] 한전 API 단가표로 실시간 계산/환산된 에너지 요금(원)
    toe_value DECIMAL(18, 4),                -- [정부 보고용] 석유환산톤(TOE) 수치
    peak_demand_kw DECIMAL(10, 2),            -- [위젯 경고용] 해당 월 최고 피크 전력값
    emission_factor_id INT REFERENCES emission_factors(factor_id) ON DELETE RESTRICT, -- 동기화된 배출계수 ID 참조
    numerical_value DECIMAL(18, 4),          -- 최종 연산된 온실가스 배출량 (tCO2eq) 또는 비율(%) 결과 수치
    text_value TEXT,
    evidence_file_url VARCHAR(1024),         -- AWS S3 고지서 스캔본 물리 경로 매핑
    status data_status_enum DEFAULT 'DRAFT',  -- DRAFT, PENDING, APPROVED, REJECTED 결재 워크플로우
    data_source_type VARCHAR(20) DEFAULT 'MANUAL', -- MANUAL, BILL, IoT, ERP
    input_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    approver_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    reject_reason TEXT,                      -- 결재 반려 시 사유 기재 속성
    hash_signature VARCHAR(64),              -- [대외 신뢰 보증] pgcrypto 활용 로우 무결성 해시 지문 값
    additional_info JSONB,                   -- 향후 프론트 차트 확장 시 생길 가변 데이터 수용 창구
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 완성차 바이어 제출용 제품별 탄소 발자국(PCF) 및 순환경제 스크랩 관리 테이블 (product_carbon_footprints)
CREATE TABLE product_carbon_footprints (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_code VARCHAR(100) NOT NULL,       -- 자동차 부품 품번
    product_name VARCHAR(255) NOT NULL,       -- 부품명 (예: Engine Piston, Crankshaft)
    allocated_carbon DECIMAL(18, 4) NOT NULL,   -- 부품 1개당 배출량 (gCO2eq / EA)
    scrap_recycle_rate DECIMAL(5, 2) DEFAULT 0.00, -- 금속 가공 스크랩(부스러기) 재활용률 통계 차트 소스
    target_year INT NOT NULL,
    additional_spec JSONB,                    -- 원자재 사양 및 바이어 요구 맞춤 속성
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, product_code, target_year)
);

-- 대기/수질 오염물질 관리 테이블 (hazardous_materials_logs - 환경부 총량제 허용 한도선 가로 점선 차트 소스)
CREATE TABLE hazardous_materials_logs (
    id BIGSERIAL PRIMARY KEY,
    facility_id INT NOT NULL REFERENCES company_facilities(id) ON DELETE CASCADE, -- 어느 공장인가
    material_name VARCHAR(150) NOT NULL,     -- SOx, NOx, BOD, COD, 특정대기유해물질, 폐수, 절삭유 등
    log_type VARCHAR(20) NOT NULL,            -- EMISSION(배출), USAGE(사용), DISPOSAL(폐기)
    quantity DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,                 -- ppm, mg, L, ton 등
    permissible_limit DECIMAL(15, 4),         -- [차트 임계선] 법적 배출 허용 기준 가로 점선 소스
    internal_target DECIMAL(15, 4),           -- [차트 임계선] 기업 자체 사내 관리 기준선 소스
    disposal_method VARCHAR(100),            -- 위탁 재활용, 소각, 화학 처리 등 폐기 방법
    logged_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 산업안전보건 및 위험성평가 관리 테이블 (health_safety_logs - 중대재해처벌법 및 하인리히 피라미드 차트 소스)
CREATE TABLE health_safety_logs (
    id BIGSERIAL PRIMARY KEY,
    facility_id INT NOT NULL REFERENCES company_facilities(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    incident_type VARCHAR(50) NOT NULL,       -- NEAR_MISS(아차사고), INJURY(부상), FATALITY(사망), INSPECTION(안전점검)
    total_working_hours INT DEFAULT 0,        -- 글로벌 표준 재해율(LTIFR) 연산용 분모 데이터 (총 노동 시간)
    near_miss_count INT DEFAULT 0,            -- 하인리히 선행 모니터링 차트용 아차사고 건수
    affected_persons INT DEFAULT 0,
    lost_days INT DEFAULT 0,                  -- 도수율/연천인율 계산용 근손실 휴업 일수
    risk_assessment_status VARCHAR(20),       -- 위험성평가 이행 현황 위젯용 상태값 (PENDING, COMPLETED)
    safety_education_rate DECIMAL(5, 2),      -- 전사 안전보건 교육 이수율 카드 소스
    description TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- ⑦ 거버넌스(G) 영역 지배구조 투명성 및 이사회 참석률 차트화를 위한 신설 테이블
-- =========================================================================

-- 이사회 구성원 마스터 테이블 (board_members - 여성 이사 비율 및 사외이사 독립성 지수 소스)
CREATE TABLE board_members (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    member_type VARCHAR(50) NOT NULL,         -- EXECUTIVE(사내이사), OUTSIDE(사외이사), AUDITOR(감사)
    gender VARCHAR(10) NOT NULL,               -- MALE(남성), FEMALE(여성) -> 여성 관리자/이사 비율 산출용
    appointed_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 이사회 회의 이력 및 참석 로그 테이블 (board_meetings - 연도별/분기별 이사회 참석률 추이 차트 소스)
CREATE TABLE board_meetings (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    meeting_title VARCHAR(255) NOT NULL,    -- 예: '2026년 제2회 정기 이사회'
    meeting_date DATE NOT NULL,
    total_members INT NOT NULL,            -- 회의 당시 이사회 등록 총원
    attended_members INT NOT NULL,         -- 실제 회의 참석 인원 -> (attended_members / total_members) * 100 = 참석률(%)
    agendas JSONB,                         -- 의결 안건 목록 (["재무제표 승인", "울산공장 증설 안건"])
    CONSTRAINT ck_board_meeting_attendance CHECK (total_members > 0 AND attended_members BETWEEN 0 AND total_members),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- =========================================================================
-- ⑧ 대시보드 시각화 타깃선, 스코어 캐싱 및 리포트 빌더 다운로드 테이블
-- =========================================================================

-- 기업별/지표별 ESG 목표 설정 테이블 (esg_target - 대시보드 차트의 목표 점선 시각화 소스)
CREATE TABLE esg_targets (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    indicator_id INT NOT NULL REFERENCES esg_indicators(id) ON DELETE RESTRICT,
    target_year INT NOT NULL,
    target_value DECIMAL(18, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, indicator_id, target_year)
);

-- 대시보드 스코어 캐싱 테이블 (esg_score - 디자인 초안의 '종합 점수 및 대형 도넛 차트' 실시간 로딩용)
CREATE TABLE esg_scores (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    reporting_period period_type_enum NOT NULL,
    period_value INT NOT NULL,               -- 연간(1), 분기(1~4), 월별(1~12)
    total_score DECIMAL(5, 2) NOT NULL,      -- 종합 점수 (예: 82.00)
    e_score DECIMAL(5, 2) NOT NULL,          -- 환경 점수 (예: 85.00)
    s_score DECIMAL(5, 2) NOT NULL,          -- 사회 점수 (예: 78.00)
    g_score DECIMAL(5, 2) NOT NULL,          -- 거버넌스 점수 (예: 83.00)
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, reporting_year, reporting_period, period_value)
);

-- 데이터 수집 현황 로그 테이블 (data_collection_log - 오른쪽 하단 '전력 사용량 정상/지연' 위젯용)
CREATE TABLE data_collection_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    indicator_id INT NOT NULL REFERENCES esg_indicators(id) ON DELETE CASCADE,
    last_collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status collection_status_enum NOT NULL DEFAULT 'NORMAL', -- NORMAL, DELAYED, ERROR
    error_message TEXT,
    UNIQUE(company_id, indicator_id)
);

-- 리포트 빌더 양식 및 공시 보고서 이력 테이블 (report_template / generated_report - 원클릭 다운로드 소스)
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    included_indicators JSONB NOT NULL,     -- 템플릿에 포함할 지표 ID 배열
    layout_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_reports (
    id SERIAL PRIMARY KEY,
    template_id INT NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,         -- 서버 또는 S3에 저장된 PDF/엑셀 다운로드 링크
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 탄소중립 실천 캠페인 테이블 (netzero_activity - 좌측 하단 새싹 위젯 연동용)
CREATE TABLE netzero_activities (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    activity_name VARCHAR(255) NOT NULL,
    reduction_estimated DECIMAL(12, 2),      -- 예상 탄소 절감량
    status VARCHAR(50) DEFAULT 'PROGRESS',    -- PROGRESS, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 데이터 변경 감사 이력 테이블 (audit_log - 주주 및 외부 감사인용 대외 공시 무결성 보증 백엔드 로그)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,        -- INSERT, UPDATE, DELETE
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    old_values JSONB,                        -- 변경 전 전체 데이터 스냅샷
    new_values JSONB,                        -- 변경 후 전체 데이터 스냅샷
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- ⑨ 수십 개의 복합 차트 무한 추가 및 대량 더미데이터 고속 조회를 위한 최적화 인덱스
-- =========================================================================

-- 시계열 꺾은선/막대 차트의 초고속 그룹 집계 및 로딩을 위한 필수 복합 인덱스
CREATE INDEX idx_metric_data_timeline ON esg_metric_data (company_id, reporting_year, period_type, period_value);

-- 소셜 가입자 및 토큰 재인증 고속화를 위한 고유 인덱스
CREATE UNIQUE INDEX idx_users_social ON users (social_provider, social_id) WHERE social_id IS NOT NULL;
CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_active_role ON users (is_active, role);

-- JSONB 내부 속성 동적 필터링 차트를 위한 GIN 검색 인덱스
CREATE INDEX idx_metric_data_jsonb ON esg_metric_data USING gin (additional_info);

-- 오염물질 총량제 규제선 차트 전용 조회 최적화 인덱스
CREATE INDEX idx_hazardous_logs_lookup ON hazardous_materials_logs (facility_id, material_name, logged_date);

-- 하인리히 아차사고 및 안전보건 선행지표 트렌드 차트용 인덱스
CREATE INDEX idx_safety_logs_lookup ON health_safety_logs (facility_id, incident_type, log_date);

-- 대외 공시 투명성 검증 및 변경 로그 역추적을 위한 복합 감사 인덱스
CREATE INDEX idx_audit_logs_tracker ON audit_logs (table_name, record_id, performed_at DESC);


-- =========================================================================
-- ⑩ [핵심 인프라] pgcrypto 기반 데이터 무결성 검증 및 변경 로그 격리 트리거 시스템
-- =========================================================================

-- 데이터 변동 발생 시 SHA-256 해시 암호화 서명 및 이력 스냅샷 자동 격리 함수
CREATE OR REPLACE FUNCTION trg_esg_data_audit_and_hash()
RETURNS TRIGGER AS $$
DECLARE
    combined_payload TEXT;
BEGIN
    -- 1. 최종 연산 수치, 연도, 주기를 결합하여 로우별 유일 해시 지문 자동 생성 (위변조 검증 마크 연동 소스)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        combined_payload := COALESCE(NEW.numerical_value::text, '') || '|' || NEW.reporting_year::text || '|' || NEW.period_value::text;
        NEW.hash_signature := encode(digest(combined_payload, 'sha256'), 'hex');
    END IF;

    -- 2. 외부 공시 투명성 확보를 위해 JSONB 형태로 변경 전/후 스냅샷을 audit_logs에 영구 격리
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs(user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (NEW.input_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs(user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (NEW.input_user_id, 'INSERT', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- esg_metric_data 테이블에 암호화 감사 트리거 최종 결합
CREATE TRIGGER trg_apply_esg_metric_audit
BEFORE INSERT OR UPDATE ON esg_metric_data
FOR EACH ROW EXECUTE FUNCTION trg_esg_data_audit_and_hash();


-- 3. 시스템 편의를 위한 공용 회원/마스터 정보 타임스탬프 자동 갱신 트리거 설정
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_pcf_timestamp
BEFORE UPDATE ON product_carbon_footprints
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
