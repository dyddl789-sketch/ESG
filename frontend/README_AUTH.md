# ESG 프론트엔드 인증 연동

## 적용 기능

- 실제 PostgreSQL 계정 로그인
- 회원가입
- 카카오 소셜 로그인
- 서버 권한 기반 라우팅
- Access Token 자동 첨부
- Access Token 만료 시 Refresh Token 자동 재발급
- 새로고침 후 로그인 상태 복구
- 로그아웃
- 401 동시 발생 시 Refresh 요청 한 번만 실행

## 실행

```bash
npm ci
npm run dev
```

기본 연결:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
API:      /api
```

`.env` 예시:

```text
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://localhost:8080
```

## 보안 방식

- Access Token은 `sessionStorage`와 메모리에 저장합니다.
- Refresh Token은 JavaScript에서 읽을 수 없는 HttpOnly 쿠키로 관리합니다.
- 페이지 새로고침 시 `/api/auth/me` 요청이 실패하면 Axios 인터셉터가 `/api/auth/refresh`를 호출합니다.
- 로그인 화면에서 권한을 선택하지 않습니다. DB에 저장된 서버 권한으로 메뉴와 라우팅을 결정합니다.

## 권한

```text
SYSTEM_ADMIN
COMPANY_MANAGER
EXTERNAL_USER
```

일반 회원가입과 카카오 신규 가입은 `EXTERNAL_USER`로 생성됩니다.

## 시연 계정

비밀번호는 모두 `Demo!1234`입니다.

```text
admin@ecoflow.co.kr
manager@ecoflow.co.kr
external@example.com
```

## 카카오 로그인

개발 환경에서 로그인 버튼은 기본적으로 다음 주소로 이동합니다.

```text
http://localhost:8080/oauth2/authorization/kakao
```

운영 Docker/Nginx 환경에서는 `/oauth2/`, `/login/oauth2/` 요청을 backend 컨테이너로 프록시하도록 `nginx.conf`가 구성되어 있습니다.

## 권한별 기본 이동

```text
SYSTEM_ADMIN    → /admin/dashboard
COMPANY_MANAGER → /manager/dashboard
EXTERNAL_USER   → /public/dashboard
```

시스템 총괄 관리자는 최종 승인과 플랫폼 관리, 기업 ESG 관리자는 수집·작성·승인 요청, 일반 사용자는 승인·공개된 ESG 정보 조회 화면만 접근합니다.
