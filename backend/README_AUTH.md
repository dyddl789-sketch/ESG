# ESG 백엔드 로그인·회원가입·카카오 로그인

## 적용 환경

- Java 17
- Spring Boot 3.5.16
- Spring Security + JWT
- PostgreSQL 16 + PostGIS + pgcrypto
- MyBatis
- Redis
- Flyway

## 실행 순서

### 기존 로컬 PostgreSQL을 사용할 때

1. `esg` 데이터베이스를 생성합니다.
2. PostgreSQL 16에 PostGIS가 설치되어 있어야 합니다.
3. Redis를 `localhost:6379`에서 실행합니다.
4. 환경변수를 설정하고 Spring Boot를 실행합니다.

```text
DB_URL=jdbc:postgresql://localhost:5432/esg
DB_USERNAME=postgres
DB_PASSWORD=본인 비밀번호
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=Base64로 인코딩한 32바이트 이상의 비밀키
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### PostgreSQL·Redis를 Docker로 실행할 때

```bash
docker compose -f docker-compose.dev.yml up -d
./gradlew bootRun
```

백엔드가 처음 실행되면 Flyway가 다음 파일을 자동 실행합니다.

```text
V1__create_esg_platform_schema.sql
V2__seed_initial_master_and_demo_users.sql
```

## 시연 계정

모든 계정의 비밀번호는 `Demo!1234`입니다.

| 권한 | 이메일 |
|---|---|
| SYSTEM_ADMIN | admin@ecoflow.co.kr |
| COMPANY_MANAGER | manager@ecoflow.co.kr |
| EXTERNAL_USER | external@example.com |

회원가입으로 생성되는 계정은 보안을 위해 항상 `EXTERNAL_USER`로 등록됩니다. 관리자와 기업 ESG 관리자 권한은 시스템 총괄 관리자가 부여하도록 확장할 수 있습니다.

## 인증 API

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/config
POST /api/auth/oauth/exchange
GET  /oauth2/authorization/kakao
```

## 토큰 보안 구조

- Access Token: 응답 본문으로 전달, 15분
- Refresh Token: HttpOnly 쿠키, 14일
- Redis에는 Refresh Token 원문이 아니라 SHA-256 해시 저장
- Refresh Token Rotation 적용
- 로그아웃된 Access Token의 `jti`를 Redis 블랙리스트에 저장
- JWT에 `tokenVersion`을 포함하여 전체 세션 무효화 확장 가능
- 로그인 5회 실패 시 Redis 기반 임시 잠금
- 카카오 로그인 완료 후 JWT를 URL에 노출하지 않고 1회용 Redis 코드로 교환

## 카카오 로그인 설정

카카오 디벨로퍼스에서 Web 플랫폼과 Redirect URI를 등록합니다.

```text
http://localhost:8080/login/oauth2/code/kakao
```

환경변수:

```text
KAKAO_CLIENT_ID=카카오_REST_API_키
KAKAO_CLIENT_SECRET=선택적으로_발급한_Client_Secret
```

카카오 키를 설정하지 않아도 일반 로그인과 회원가입은 사용할 수 있습니다.

## Flyway 주의사항

- 비어 있는 `esg` 데이터베이스에서 최초 실행하세요.
- 한 번 실행된 `V1`, `V2` 파일은 수정하지 않습니다.
- 이후 변경은 `V3__...sql`처럼 새 migration으로 추가합니다.
- V1은 PostGIS `GEOMETRY(Point, 4326)`를 사용하므로 PostGIS가 없으면 실행되지 않습니다.
