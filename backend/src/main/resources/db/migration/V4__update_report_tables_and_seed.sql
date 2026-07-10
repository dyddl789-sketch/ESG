-- =========================================================================
-- [Flyway V4] 보고서 관련 추가 컬럼 반영, 외래키 보완 및 트리거/더미 적재
-- =========================================================================

-- 1. report_templates 테이블에 수정을 추적할 updated_at 컬럼 추가
ALTER TABLE report_templates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. generated_reports 테이블에 요청 사항(title, content) 및 updated_at 컬럼 추가
ALTER TABLE generated_reports 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '제목 없음',
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. generated_reports 테이블의 기존 외래키를 안전하게 정리하고 상호 연동 구조로 교정
ALTER TABLE generated_reports DROP CONSTRAINT IF EXISTS generated_reports_template_id_fkey;
ALTER TABLE generated_reports 
ADD CONSTRAINT fk_generated_reports_template 
FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL;


-- =========================================================================
-- 자동 타임스탬프 트리거 연결 (V4 시점 신설 테이블 추적용)
-- =========================================================================
DROP TRIGGER IF EXISTS trg_update_report_templates_timestamp ON report_templates;
CREATE TRIGGER trg_update_report_templates_timestamp
BEFORE UPDATE ON report_templates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_generated_reports_timestamp ON generated_reports;
CREATE TRIGGER trg_update_generated_reports_timestamp
BEFORE UPDATE ON generated_reports
FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- =========================================================================
-- 디자인 초안 연동을 위한 실무 기반 ESG 템플릿 5종 초기 더미 데이터 삽입
-- =========================================================================
INSERT INTO report_templates (company_id, title, included_indicators, layout_settings, content)
VALUES
(
    1,
    '통합 지속가능경영보고서 (GRI 표준)',
    '[]'::jsonb,
    '{"theme": "standard", "showPageNumber": true, "orientation": "portrait"}'::jsonb,
    '<h2>통합 지속가능경영보고서 요약</h2><br/><h3>환경(E) 성과</h3><ul><li>온실가스 Scope 1, 2 배출량: <strong>전년 대비 5% 감축</strong></li><li>폐기물 재활용률: 85% 달성</li></ul><h3>사회(S) 성과</h3><ul><li>임직원 정기 안전 교육 이수율: 100%</li><li>공급망 ESG 평가 도입 비율: 60%</li></ul><h3>거버넌스(G) 성과</h3><ul><li>이사회 내 여성 임원 비율 확대</li><li>윤리경영 위원회 신설</li></ul>'
),
(
    1,
    '기후변화 대응 특별 보고서 (TCFD 프레임워크)',
    '[]'::jsonb,
    '{"theme": "eco-green", "showPageNumber": true, "orientation": "portrait"}'::jsonb,
    '<h2>기후변화 대응 특별 보고서</h2><br/><h3>1. 기후변화 거버넌스</h3><p>이사회 산하 기후변화 대응 위원회를 통해 매월 배출량 현황을 모니터링합니다.</p><h3>2. 리스크 및 기회 관리</h3><p>탄소 배출권 거래제 도입에 따른 재무적 리스크를 분석하고 에너지 효율화 투자를 확대하고 있습니다.</p><h3>3. 온실가스 감축 목표 (Net-Zero 2050)</h3><ul><li>2030년 중간 목표: 기준 연도 대비 35% 감축</li><li>현재 달성률: <strong>12.4%</strong></li></ul>'
),
(
    1,
    '공급망 및 인권 경영 실적 보고서',
    '[]'::jsonb,
    '{"theme": "social-blue", "showPageNumber": true, "orientation": "portrait"}'::jsonb,
    '<h2>공급망 및 인권 경영 실적 보고서</h2><br/><h3>1. 인권 경영 선언</h3><p>당사는 UN 인권 선언 및 ILO 핵심 협약을 준수하며 아동 노동 및 강제 노동을 엄격히 금지합니다.</p><h3>2. 공급망 ESG 리스크 평가</h3><ul><li>1차 핵심 협력사 50개사 대상 서면 평가 완료</li><li>고위험군 협력사 3개사 대상 현장 실사 및 개선 권고</li></ul><h3>3. 안전 및 보건</h3><p>산업재해율(LTIR): <strong>0.12</strong> (업계 평균 대비 우수 수준)</p>'
),
(
    1,
    '이사회 및 윤리경영 현황 보고서',
    '[]'::jsonb,
    '{"theme": "corporate-gray", "showPageNumber": true, "orientation": "portrait"}'::jsonb,
    '<h2>이사회 및 윤리경영 현황 보고서</h2><br/><h3>1. 이사회 독립성 및 다양성</h3><ul><li>사외이사 비율: 전체 7명 중 4명 (57%)</li><li>이사회 출석률: 98%</li></ul><h3>2. 윤리 및 반부패 경영</h3><p>전 임직원 대상 부패방지방침(ISO 37001) 교육을 연 2회 실시하고 있으며, 내부 고발자 보호 제도를 명문화하여 운영 중입니다.</p><h3>3. 주주 권리 보호</h3><p>전자투표제 도입 및 주주총회 분산 개최를 통해 주주 참여를 적극 보장합니다.</p>'
),
(
    1,
    '글로벌 투자자용 ESG 팩트북 (정량 데이터 요약)',
    '[]'::jsonb,
    '{"theme": "data-minimal", "showPageNumber": false, "orientation": "landscape"}'::jsonb,
    '<h2>글로벌 투자자용 ESG 팩트북</h2><br/><h3>핵심 정량 데이터 요약</h3><ul><li><strong>에너지 총 사용량:</strong> 45,000 MWh</li><li><strong>용수 총 사용량:</strong> 120,000 톤</li><li><strong>여성 근로자 비율:</strong> 32%</li><li><strong>R&D 투자액:</strong> 매출액 대비 4.5%</li><li><strong>ESG 위원회 개최 횟수:</strong> 연 6회</li></ul><p><br/></p><p>※ 본 데이터는 제3자 검증 기관의 인증을 완료한 수치입니다.</p>'
);
