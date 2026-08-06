-- 사업장 운영기간에 따른 영역별 필수 지표 완성 상태와 감사 로그 실시간 갱신 기반을 추가한다.

ALTER TABLE esg_scores
    ADD COLUMN IF NOT EXISTS environment_complete BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS social_complete BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS governance_complete BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS overall_complete BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_esg_scores_published_period
    ON esg_scores (company_id, reporting_year, period_value DESC)
    WHERE reporting_period = 'MONTHLY' AND overall_complete = TRUE;

COMMENT ON COLUMN esg_scores.environment_complete IS
    '기준월 운영 사업장의 전력·Scope2·출하액 필수 구성요소가 모두 승인되었는지 여부';
COMMENT ON COLUMN esg_scores.social_complete IS
    '기준월 운영 사업장의 사회 지표 4종이 모두 승인되었는지 여부';
COMMENT ON COLUMN esg_scores.governance_complete IS
    '기업 공통 거버넌스 2종과 운영 사업장별 윤리교육 지표가 모두 승인되었는지 여부';
COMMENT ON COLUMN esg_scores.overall_complete IS
    '외부 사용자에게 공개 가능한 월별 E·S·G 전체 완성 여부';

-- 삭제도 감사 로그에 남기고 승인·반려 처리자는 approver_user_id를 우선 사용한다.
DROP TRIGGER IF EXISTS trg_apply_esg_metric_audit ON esg_metric_data;

CREATE OR REPLACE FUNCTION trg_esg_data_audit_and_hash()
RETURNS TRIGGER AS $$
DECLARE
    combined_payload TEXT;
    actor_user_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs(user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (OLD.input_user_id, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;

    combined_payload := COALESCE(NEW.numerical_value::text, '')
        || '|' || NEW.reporting_year::text
        || '|' || NEW.period_value::text;
    NEW.hash_signature := encode(digest(combined_payload, 'sha256'), 'hex');
    actor_user_id := COALESCE(NEW.approver_user_id, NEW.input_user_id);

    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs(user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (actor_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs(user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (actor_user_id, 'INSERT', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_esg_metric_audit
BEFORE INSERT OR UPDATE OR DELETE ON esg_metric_data
FOR EACH ROW EXECUTE FUNCTION trg_esg_data_audit_and_hash();
