-- 기업·사업장 정보를 실무형 문서 레이아웃으로 제공하기 위한 기준정보 보강
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS founded_on DATE,
    ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_item VARCHAR(255),
    ADD COLUMN IF NOT EXISTS representative_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS representative_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS operation_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE company_facilities
    ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS manager_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE companies
SET founded_on = COALESCE(founded_on, DATE '2016-03-02'),
    business_type = COALESCE(business_type, '제조업'),
    business_item = COALESCE(business_item, '자동차 부품 제조'),
    representative_phone = COALESCE(representative_phone, '02-1234-5678'),
    representative_email = COALESCE(representative_email, 'contact@ecoflow.co.kr'),
    operation_status = COALESCE(operation_status, 'ACTIVE')
WHERE business_number = '123-45-67890';

UPDATE company_facilities
SET manager_name = CASE
        WHEN facility_type = 'HQ' THEN COALESCE(manager_name, '김ESG')
        WHEN facility_name LIKE '%부산%' THEN COALESCE(manager_name, '박정은')
        WHEN facility_name LIKE '%울산%' THEN COALESCE(manager_name, '홍현민')
        ELSE COALESCE(manager_name, '조성민')
    END,
    manager_phone = COALESCE(manager_phone, '010-0000-0000'),
    is_active = COALESCE(is_active, TRUE)
WHERE company_id = (SELECT id FROM companies WHERE business_number = '123-45-67890' LIMIT 1);
