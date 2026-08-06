-- 파일 위치: src/main/resources/db/migration/V4__update_report_tables_and_seed.sql
-- 버전: v4.0.0
-- 기능 요약: 5개로 분산되었던 템플릿을 1개로 통합하고, 프론트엔드에서 실제 데이터를 바인딩할 수 있도록 {지표코드} 변수 포맷을 본문에 삽입하여 적재합니다.

-- =========================================================================
-- [Flyway V4] 무중단 안전 기법 - 볼륨 불일치 우회 및 통합 보고서 양식 적재
-- =========================================================================

ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS company_id INT;
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS target_year INT;
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS scope VARCHAR(100);
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '제목 없음';
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE generated_reports DROP CONSTRAINT IF EXISTS generated_reports_template_id_fkey;
ALTER TABLE generated_reports DROP CONSTRAINT IF EXISTS fk_generated_reports_template_v4;
ALTER TABLE generated_reports 
ADD CONSTRAINT fk_generated_reports_template_v4 
FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS trg_update_report_templates_timestamp ON report_templates;
CREATE TRIGGER trg_update_report_templates_timestamp
BEFORE UPDATE ON report_templates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_generated_reports_timestamp ON generated_reports;
CREATE TRIGGER trg_update_generated_reports_timestamp
BEFORE UPDATE ON generated_reports
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =========================================================================
-- [정합성 100%] 동적 변수({지표코드})가 포함된 통합 템플릿 1종 단독 적재
-- =========================================================================
DO $$
DECLARE
    v_company_id INT;
    v_elec_id INT;
    v_scope2_id INT;
    v_injury_id INT;
    v_safety_edu_id INT;
    v_turnover_id INT;
    v_attendance_id INT;
BEGIN
    SELECT id INTO v_company_id FROM companies WHERE name = '에코모빌리티 파츠 주식회사' LIMIT 1;
    SELECT id INTO v_elec_id FROM esg_indicators WHERE indicator_code = 'IND_E_ELEC';
    SELECT id INTO v_scope2_id FROM esg_indicators WHERE indicator_code = 'IND_E_SCOPE2';
    SELECT id INTO v_injury_id FROM esg_indicators WHERE indicator_code = 'IND_S_INJURY_RATE';
    SELECT id INTO v_safety_edu_id FROM esg_indicators WHERE indicator_code = 'IND_S_SAFETY_EDU';
    SELECT id INTO v_turnover_id FROM esg_indicators WHERE indicator_code = 'IND_S_TURNOVER';
    SELECT id INTO v_attendance_id FROM esg_indicators WHERE indicator_code = 'IND_G_ATTENDANCE';

    IF v_company_id IS NOT NULL THEN
        -- 기존 분산된 템플릿 초기화 후 단일 템플릿 적재
        DELETE FROM report_templates WHERE company_id = v_company_id;

        INSERT INTO report_templates (company_id, title, included_indicators, layout_settings, content)
        VALUES (
            v_company_id,
            '통합 지속가능경영보고서 (ESG 통합)',
            to_jsonb(ARRAY[v_elec_id, v_scope2_id, v_injury_id, v_safety_edu_id, v_turnover_id, v_attendance_id]),
            '{"theme": "standard", "showPageNumber": true, "orientation": "portrait"}'::jsonb,
            '<p><strong>1. 기후변화 거버넌스 및 온실가스 감축</strong></p><p>이사회 산하 기후변화 대응 위원회를 통해 매월 에너지 현황을 모니터링합니다. 본 보고 범위 기준 전력 사용량은 <strong>{IND_E_ELEC}</strong> 이며, 이에 따른 온실가스 배출량은 <strong>{IND_E_SCOPE2}</strong>를 기록하였습니다.</p><p><br></p><p><strong>2. 산업 안전 및 인권 경영</strong></p><p>안전한 사업장 구축을 최우선으로 삼고 있습니다. 현재 산업재해율은 <strong>{IND_S_INJURY_RATE}</strong>로 관리되고 있으며, 전사 안전교육 이수율은 <strong>{IND_S_SAFETY_EDU}</strong>를 달성했습니다. 또한 건강한 조직 문화를 반영하여 퇴사율은 <strong>{IND_S_TURNOVER}</strong>를 기록 중입니다.</p><p><br></p><p><strong>3. 지배구조 투명성</strong></p><p>이사회 참석률 <strong>{IND_G_ATTENDANCE}</strong>를 유지하며, 주주와 이해관계자를 위한 투명한 의사결정 체계를 확립하고 윤리경영을 실천하고 있습니다.</p>'
        );
    END IF;
END $$;