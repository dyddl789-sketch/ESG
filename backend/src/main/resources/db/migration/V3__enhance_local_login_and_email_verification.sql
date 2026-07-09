-- 기존 V1/V2를 수정하지 않고 로그인 아이디, 이메일 인증, 휴대폰 중복 제약을 확장합니다.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- 기존 계정은 마이그레이션 이전에 사용 중이던 계정이므로 인증 완료 상태로 보정합니다.
UPDATE users
   SET email_verified = TRUE,
       email_verified_at = COALESCE(email_verified_at, created_at)
 WHERE email_verified = FALSE;

-- 시연 계정도 이메일이 아니라 로그인 아이디로 접속할 수 있도록 변경합니다.
UPDATE users SET login_id = 'systemadmin' WHERE LOWER(email) = 'admin@ecoflow.co.kr';
UPDATE users SET login_id = 'esgmanager' WHERE LOWER(email) = 'manager@ecoflow.co.kr';
UPDATE users SET login_id = 'externaluser' WHERE LOWER(email) = 'external@example.com';

-- 로그인 아이디는 대소문자를 구분하지 않고 중복을 차단합니다.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id_lower
    ON users (LOWER(login_id));

-- 휴대폰 번호가 입력된 계정끼리는 중복을 허용하지 않습니다.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number_unique
    ON users (phone_number)
    WHERE phone_number IS NOT NULL;
