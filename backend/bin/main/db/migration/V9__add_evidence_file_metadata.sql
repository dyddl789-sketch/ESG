-- ============================================================================
-- V10: ESG 증빙파일의 실제 업로드 메타정보 저장
-- ============================================================================

ALTER TABLE esg_metric_data
    ADD COLUMN IF NOT EXISTS evidence_original_filename VARCHAR(512),
    ADD COLUMN IF NOT EXISTS evidence_content_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS evidence_file_size BIGINT,
    ADD COLUMN IF NOT EXISTS evidence_uploaded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE esg_metric_data
    DROP CONSTRAINT IF EXISTS ck_esg_metric_evidence_file_size_nonnegative;

ALTER TABLE esg_metric_data
    ADD CONSTRAINT ck_esg_metric_evidence_file_size_nonnegative
    CHECK (evidence_file_size IS NULL OR evidence_file_size >= 0);

COMMENT ON COLUMN esg_metric_data.evidence_original_filename IS
    '사용자가 업로드한 ESG 증빙파일의 원본 파일명';
COMMENT ON COLUMN esg_metric_data.evidence_content_type IS
    '업로드 시 확인한 증빙파일 MIME 타입';
COMMENT ON COLUMN esg_metric_data.evidence_file_size IS
    '업로드 시 확인한 증빙파일 크기(byte)';
COMMENT ON COLUMN esg_metric_data.evidence_uploaded_at IS
    '증빙파일이 실제 파일 저장소에 업로드된 시각';

-- 과거 데이터는 실제 업로드 메타정보가 없으므로 URL에서 확인 가능한 파일명만 보완한다.
-- 실제 물리 파일 존재 여부는 파일 상태 API에서 별도로 확인한다.
UPDATE esg_metric_data
SET evidence_original_filename = CASE
        WHEN evidence_file_url IS NULL OR BTRIM(evidence_file_url) = '' THEN NULL
        ELSE REGEXP_REPLACE(
            REGEXP_REPLACE(evidence_file_url, '^.*/', ''),
            '^[0-9a-fA-F-]{36}_',
            ''
        )
    END,
    evidence_content_type = CASE
        WHEN evidence_file_url IS NULL OR BTRIM(evidence_file_url) = '' THEN NULL
        ELSE 'application/pdf'
    END
WHERE evidence_file_url IS NOT NULL
  AND BTRIM(evidence_file_url) <> ''
  AND evidence_original_filename IS NULL;
