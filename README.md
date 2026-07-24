# Cloud-Based ESG Data Management Platform

기업의 **환경(Environment)·사회(Social)·거버넌스(Governance)** 데이터를 통합 수집·관리하고,  
검토·승인·통계·대시보드·보고서 기능을 제공하는 클라우드 기반 ESG 데이터 관리 플랫폼입니다.

---

## 빠른 문서 링크

- [협업 규칙 확인](./CONTRIBUTING.md)
- [docs 문서 관리 가이드 확인](./docs/docs_README.md)

> 현재 `docs` 폴더의 가이드 파일명이 `docs_README.md`이므로 위 경로를 사용합니다.

---

## 1. 프로젝트 개요

### 프로젝트명

**클라우드 기반 ESG 데이터 관리 플랫폼**

### 개발 목적

- ESG 데이터를 부문별로 등록하고 체계적으로 관리
- 기간·사업장·조직별 ESG 지표 조회
- 데이터 검토 및 승인 이력 관리
- ESG 성과를 대시보드와 보고서로 시각화
- AWS와 Docker를 활용한 클라우드 배포 환경 구축
- GitHub 기반 협업 및 CI/CD 경험 확보

---

## 2. 주요 기능

### 환경 Environment

- 온실가스 배출량 관리
- 에너지 사용량 관리
- 재생에너지 사용 실적 관리
- 용수 사용량 관리
- 폐기물 발생량 및 재활용률 관리
- 환경 목표 대비 실적 조회

### 사회 Social

- 임직원 현황 관리
- 다양성 및 포용성 지표 관리
- 산업재해 및 안전사고 관리
- 임직원 교육 이수 관리
- 사회공헌 활동 관리
- 협력사 및 공급망 사회 지표 관리

### 거버넌스 Governance

- 이사회 구성 현황 관리
- 사외이사 비율 관리
- 윤리교육 이수 현황 관리
- 내부 신고 및 감사 이력 관리
- 규정 준수 현황 관리
- 리스크 및 내부통제 데이터 관리

### 공통 및 관리자 기능

- 회원가입·로그인·JWT 인증
- 사용자·부서·직책·권한 관리
- ESG 데이터 등록·수정·삭제·조회
- 담당자 검토 및 승인
- 통합 대시보드와 기간별 통계
- ESG 보고서 생성 및 다운로드
- 변경 이력과 감사 로그 관리
- 공지사항 및 알림 관리

---

## 3. 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | React, Vite, JavaScript 또는 TypeScript, Axios, Chart.js |
| Backend | Java 17, Spring Boot, Spring Security, Validation |
| Persistence | MyBatis 또는 JPA 중 프로젝트에서 선택한 방식으로 통일 |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Infrastructure | AWS EC2, RDS, S3, Nginx |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Collaboration | GitHub, Slack, Notion |
| Build | Gradle Wrapper |

> 팀원이 IntelliJ IDEA와 STS 중 어떤 IDE를 사용하더라도 프로젝트는 **Gradle Wrapper와 Git 기준**으로 동일하게 관리합니다.

---

## 4. 저장소 구조

```text
ESG/
├── backend/                         # Spring Boot
├── frontend/                        # React + Vite
├── database/
│   ├── schema/                      # 최초 테이블 생성 SQL
│   ├── migration/                   # DB 변경 SQL
│   └── seed/                        # 샘플 및 초기 데이터
├── infra/
│   ├── docker/                      # Docker 관련 설정
│   ├── nginx/                       # Nginx 설정
│   └── scripts/                     # 배포 및 운영 스크립트
├── docs/
│   ├── docs_README.md                # docs 문서 배치 및 작성 가이드
│   ├── 01-planning/                 # 요구사항, 일정, 역할 분담
│   ├── 02-design/                   # 화면설계서, ERD, 아키텍처
│   ├── 03-api/                      # API 명세
│   ├── 04-test/                     # 테스트 계획 및 결과
│   ├── 05-presentation/             # 발표 자료와 대본
│   └── meeting-notes/               # 회의록
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── pull_request_template.md
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

---

# 5. 핵심 협업 규칙

상세 규칙은 [`CONTRIBUTING.md`](./CONTRIBUTING.md)에서 확인할 수 있습니다.  
프로젝트에서 반드시 지켜야 할 핵심 내용은 아래와 같습니다.

## 5.1 브랜치 흐름

```text
feature/* ─┐
fix/*     ─┼─> develop ─> main
docs/*    ─┤
infra/*   ─┘
```

| 브랜치 | 용도 |
|---|---|
| `main` | 최종 배포 및 발표 가능한 안정 버전 |
| `develop` | 팀원 기능을 통합하는 개발 브랜치 |
| `feature/*` | 신규 기능 개발 |
| `fix/*` | 버그 수정 |
| `refactor/*` | 코드 구조 개선 |
| `docs/*` | 문서와 산출물 작업 |
| `infra/*` | AWS, Docker, Nginx, CI/CD 작업 |

### 브랜치 이름 예시

```text
feature/12-environment-data
feature/18-esg-dashboard
fix/27-login-token
refactor/31-approval-service
docs/8-api-spec
infra/15-docker-compose
```

### 작업 시작

```bash
git switch develop
git pull origin develop
git switch -c feature/이슈번호-기능명
```

### 작업 완료

```bash
git add .
git commit -m "feat: 환경 데이터 등록 기능 구현"
git push -u origin feature/이슈번호-기능명
```

Pull Request는 원칙적으로 다음 방향으로 생성합니다.

```text
작업 브랜치 → develop → main
```

`main`과 `develop`에는 직접 Push하지 않습니다.

---

## 5.2 커밋 메시지

| 유형 | 설명 |
|---|---|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없는 코드 구조 개선 |
| `docs` | 문서 수정 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 설정, 의존성, 기타 작업 |
| `build` | Gradle 및 빌드 설정 |
| `ci` | GitHub Actions 등 CI/CD |
| `infra` | Docker, AWS, Nginx 등 인프라 |
| `style` | 코드 의미가 바뀌지 않는 서식 수정 |

```text
feat: 환경 데이터 등록 API 구현
fix: ESG 종합점수 계산 오류 수정
refactor: 승인 처리 로직을 도메인 서비스로 분리
docs: 사용자 요구사항 정의서 추가
infra: PostgreSQL Docker Compose 설정 추가
```

---

# 6. 폴더·패키지 컨벤션 — 도메인 중심 구조

이 프로젝트는 기능 종류별 상위 계층이 아니라 **업무 도메인 중심 구조**를 사용합니다.

## 6.1 금지하는 전역 계층 구조

다음처럼 모든 Controller와 Service를 한곳에 모으지 않습니다.

```text
com.esg.platform
├── controller/
├── service/
├── mapper/
└── dto/
```

프로젝트가 커지면 하나의 기능을 수정하기 위해 여러 폴더를 오가야 하므로 관리가 어려워집니다.

## 6.2 권장 백엔드 패키지 구조

```text
backend/src/main/java/com/esg/platform/
├── global/
│   ├── config/
│   ├── security/
│   ├── exception/
│   ├── response/
│   └── util/
│
├── domain/
│   ├── auth/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   └── response/
│   │   └── security/
│   │
│   ├── member/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── mapper/                 # MyBatis 사용 시
│   │   ├── entity/                 # DB 테이블 대응 객체
│   │   └── dto/
│   │       ├── request/
│   │       └── response/
│   │
│   ├── environment/
│   ├── social/
│   ├── governance/
│   ├── approval/
│   ├── dashboard/
│   ├── report/
│   ├── notification/
│   └── admin/
│
└── EsgApplication.java
```

### 도메인 내부 예시

```text
domain/environment/
├── controller/
│   └── EnvironmentDataController.java
├── service/
│   ├── EnvironmentDataService.java
│   └── EnvironmentDataServiceImpl.java
├── mapper/
│   └── EnvironmentDataMapper.java
├── entity/
│   └── EnvironmentData.java
├── dto/
│   ├── request/
│   │   ├── EnvironmentDataCreateRequest.java
│   │   └── EnvironmentDataUpdateRequest.java
│   └── response/
│       ├── EnvironmentDataResponse.java
│       └── EnvironmentDataSummaryResponse.java
└── exception/
    └── EnvironmentDataNotFoundException.java
```
> [`Backend domain`](https://github.com/dyddl789-sketch/ESG/blob/feature/docs/docs/02-design/directory-structure.md#11-domain)을 선택하면 백엔드 도메인의 내부 경로를 확인할 수 있습니다.  
  

### MyBatis XML 경로

Java 패키지 구조와 대응되도록 도메인별로 관리합니다.

```text
backend/src/main/resources/
├── application.yml
├── application-local.yml
├── application-prod.yml
└── mybatis/
    └── mappers/
        ├── member/
        │   └── MemberMapper.xml
        ├── environment/
        │   └── EnvironmentDataMapper.xml
        ├── social/
        │   └── SocialDataMapper.xml
        └── governance/
            └── GovernanceDataMapper.xml
```

> MyBatis를 선택하면 `mapper`, JPA를 선택하면 `repository`를 사용합니다. 같은 도메인에서 두 방식을 임의로 혼합하지 않습니다.

---

## 6.3 백엔드 역할 규칙

| 구성요소 | 책임 |
|---|---|
| `controller` | 요청 수신, 입력 검증, 응답 반환 |
| `service` | 비즈니스 규칙, 트랜잭션, 도메인 흐름 처리 |
| `mapper/repository` | DB 조회와 저장 |
| `entity` | DB 테이블 및 핵심 도메인 데이터 표현 |
| `dto/request` | 클라이언트 요청 데이터 |
| `dto/response` | 클라이언트 응답 데이터 |
| `global` | 여러 도메인에서 공통으로 사용하는 기능 |

### 의존 방향

```text
Controller → Service → Mapper/Repository → Database
```

다음과 같은 호출은 금지합니다.

```text
Controller → Mapper 직접 호출
Mapper → Service 호출
한 도메인의 Controller → 다른 도메인의 Mapper 직접 호출
```

다른 도메인의 기능이 필요하면 해당 도메인의 Service를 호출합니다.

---

## 6.4 프론트엔드 도메인 구조

```text
frontend/src/
├── app/
│   ├── router/
│   ├── providers/
│   └── store/
├── layouts/
│   ├── PublicLayout.jsx
│   ├── UserLayout.jsx
│   └── AdminLayout.jsx
├── domains/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── environment/
│   ├── social/
│   ├── governance/
│   ├── approval/
│   ├── dashboard/
│   ├── report/
│   └── admin/
├── shared/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── constants/
│   ├── styles/
│   └── utils/
├── assets/
└── main.jsx
```

### 프론트엔드 구분 기준

- 특정 ESG 기능에서만 사용하는 코드는 해당 `domains` 아래에 둡니다.
- 2개 이상의 도메인에서 실제로 재사용되는 코드만 `shared`로 이동합니다.
- 모든 컴포넌트를 처음부터 `shared/components`에 넣지 않습니다.
- API 파일도 도메인별로 분리합니다.

```text
domains/environment/api/environmentApi.js
domains/social/api/socialApi.js
domains/governance/api/governanceApi.js
```

---

## 6.5 파일과 클래스 이름

### Java

```text
클래스: PascalCase
메서드·변수: camelCase
상수: UPPER_SNAKE_CASE
패키지: 소문자
```

```java
EnvironmentDataController
EnvironmentDataService
EnvironmentDataCreateRequest
findEnvironmentDataById()
MAX_REPORT_FILE_SIZE
```

### React

```text
컴포넌트: PascalCase
일반 함수·변수: camelCase
Hook: use로 시작
API 파일: 도메인명Api
CSS Module: ComponentName.module.css
```

```text
EnvironmentDataPage.jsx
EnvironmentDataForm.jsx
useEnvironmentData.js
environmentApi.js
```

### URL

복수형 명사와 소문자를 사용합니다.

```text
/api/environment-data
/api/social-data
/api/governance-data
/api/approvals
/api/reports
```

동사형 URL보다 HTTP 메서드로 행위를 표현합니다.

```text
권장:   POST /api/environment-data
비권장: POST /api/createEnvironmentData
```

---

# 7. DB 관리 규칙

```text
database/
├── schema/
│   └── 01_create_tables.sql
├── migration/
│   ├── 20260707_01_add_member_role.sql
│   └── 20260709_01_add_environment_target.sql
└── seed/
    └── 01_sample_data.sql
```

- DBeaver에서 직접 수정했더라도 동일한 SQL 파일을 반드시 남깁니다.
- 이미 공유된 migration 파일은 내용을 수정하지 않고 새 migration 파일을 추가합니다.
- 테이블과 컬럼 이름은 `snake_case`를 사용합니다.
- 기본키는 도메인명과 의미가 드러나게 작성합니다.

```text
member_id
environment_data_id
approval_document_id
```

- 운영 데이터와 개인정보가 포함된 DB 백업 파일은 GitHub에 올리지 않습니다.

---

# 8. 환경변수 및 보안

실제 값은 `.env`, 운영 서버 환경변수 또는 별도 Secret 저장소에서 관리합니다.

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

GitHub에 올리면 안 되는 항목:

```text
AWS Access Key
AWS Secret Access Key
DB 비밀번호
JWT Secret
OAuth Client Secret
API 인증키
PEM·SSH 개인키
실제 사용자 개인정보
application-secret.yml
실제 .env
```

환경변수 이름과 예시만 `.env.example`에 작성합니다.

---

# 9. 로컬 실행

## Backend

```bash
cd backend

# Windows
gradlew.bat clean build
gradlew.bat bootRun

# macOS / Linux
./gradlew clean build
./gradlew bootRun
```

## Frontend

```bash
cd frontend
npm ci
npm run dev
```

## Docker Compose

```bash
docker compose up -d
docker compose ps
docker compose logs -f
```

---

# 10. Pull Request 확인사항

- 관련 Issue가 연결되어 있는가
- 기능 브랜치에서 `develop`으로 요청했는가
- 불필요한 IDE 파일이 포함되지 않았는가
- 민감정보가 포함되지 않았는가
- 새 라이브러리가 `build.gradle` 또는 `package.json`에 반영되었는가
- DB 변경 SQL이 `database/migration`에 추가되었는가
- 로컬 빌드와 주요 기능 테스트를 완료했는가
- 화면 변경이 있다면 스크린샷을 첨부했는가

---

# 11. 팀 개발 원칙

1. IDE는 자유롭게 사용하되 Java·Gradle·Node·DB 버전은 통일합니다.
2. 라이브러리는 개인 IDE에만 추가하지 않고 빌드 설정 파일에 기록합니다.
3. 기능은 도메인 폴더 안에서 완결되도록 구성합니다.
4. 공통 코드는 실제로 둘 이상의 도메인에서 사용될 때만 분리합니다.
5. `main`과 `develop`에 직접 Push하지 않습니다.
6. 작업 시작 전 `develop`을 최신 상태로 갱신합니다.
7. 하나의 PR에는 가능한 한 하나의 작업 목적만 포함합니다.
8. DB 변경, 환경변수 추가, API 변경은 PR 설명에 반드시 기록합니다.
9. 비밀키와 개인정보는 GitHub와 Slack에 공유하지 않습니다.
10. 배포 가능한 상태는 `main`, 개발 통합 상태는 `develop`에서 관리합니다.

---

# 12. 저장소 루트 파일 안내

저장소 루트의 설정 파일은 팀원의 운영체제와 IDE가 달라도 같은 방식으로 개발하고, 민감정보와 불필요한 파일이 GitHub에 올라가는 것을 방지하기 위해 사용합니다.

| 파일 | 역할 | GitHub 업로드 | 수정 시 주의사항 |
|---|---|---|---|
| [`README.md`](./README.md) | 프로젝트 목적, 기술 스택, 실행 방법, 저장소 구조를 안내하는 대표 문서 | 포함 | 구조·실행 방법이 변경되면 함께 수정 |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 브랜치, 커밋, PR, 코드 리뷰, 폴더 규칙을 정의하는 공식 협업 규칙 | 포함 | 협업 규칙의 원본 문서로 사용 |
| [`.editorconfig`](./.editorconfig) | Java는 4칸, React·JSON·CSS는 2칸 등 IDE 공통 편집 형식을 지정 | 포함 | 개인 취향으로 임의 변경하지 않음 |
| [`.gitattributes`](./.gitattributes) | Windows와 Linux 사이의 줄바꿈 차이를 제어하고 불필요한 전체 파일 변경을 방지 | 포함 | 배치 파일은 CRLF, 소스 파일은 LF 유지 |
| [`.gitignore`](./.gitignore) | `node_modules`, `dist`, IDE 설정, 로그 등 Git에 올리지 않을 파일을 정의 | 포함 | 필요한 소스나 설정 파일을 실수로 제외하지 않도록 확인 |
| [`.env.example`](./.env.example) | 프로젝트 실행에 필요한 환경변수 이름만 제공하는 견본 | 포함 | 실제 비밀번호·키·토큰은 절대 작성하지 않음 |
| `.env` | 각 개발자의 실제 로컬 환경변수 | 제외 | GitHub·Slack·Notion에 업로드 금지 |
| [`docker-compose.yml`](./docker-compose.yml) | Frontend, Backend, PostgreSQL, Redis 등의 컨테이너 실행 구성을 정의 | 포함 | 서비스명과 환경변수 변경 시 팀에 공지 |

## 12.1 현재 설정 파일의 실제 의미

### [`.editorconfig`](./.editorconfig)

```text
전체 파일: UTF-8, LF, 마지막 줄 추가, 불필요한 공백 제거
Java: 공백 4칸
JS/JSX/TS/JSON/CSS/HTML/YAML: 공백 2칸
Markdown: 문장 끝 공백 유지 허용
```

### [`.env.example`](./.env.example)

현재 프로젝트에서 사용하는 환경변수의 이름과 형식을 알려줍니다.

```text
Backend 포트
PostgreSQL 접속 정보
Redis 접속 정보
JWT Secret
AWS 리전 및 인증정보 이름
Frontend API 기본 주소
```

팀원은 이 파일을 복사해 실제 `.env`를 만든 뒤 개인 환경에 맞는 값을 입력합니다.

```bash
# Windows CMD
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### [`.gitattributes`](./.gitattributes)

```text
Java, JavaScript, JSX, YAML, Shell Script → LF
Windows BAT, CMD → CRLF
```

### [`.gitignore`](./.gitignore)

현재 다음 항목은 GitHub에 올라가지 않습니다.

```text
node_modules/
dist/
각종 로그
.idea/
대부분의 .vscode 설정
운영체제 임시 파일
*.local
```

`package.json`과 `package-lock.json`은 제외 목록에 없으므로 반드시 GitHub에 포함됩니다.

---

# 13. 문서 폴더 사용 안내

`docs/`는 단순 참고자료 보관함이 아니라 프로젝트의 기획·설계·API·테스트·발표 산출물을 단계별로 관리하는 공간입니다.

상세한 파일 배치 기준과 이름 규칙은 [`docs/docs_README.md`](./docs/docs_README.md)에서 확인합니다.

```text
docs/
├── docs_README.md        # 문서 폴더 사용 가이드
├── 01-planning/          # 기획·요구사항·일정·역할분담
├── 02-design/            # 업무흐름도·화면설계·ERD·아키텍처
├── 03-api/               # API 명세와 요청·응답 예시
├── 04-test/              # 테스트 계획·케이스·결과·결함 기록
├── 05-presentation/      # 발표 자료·대본·시연 시나리오
└── meeting-notes/        # 날짜별 회의록과 결정사항
```

## 13.1 문서 업로드 원칙

1. 문서를 작성하기 전에 목적에 맞는 폴더를 선택합니다.
2. 파일명만 보고도 내용을 알 수 있게 작성합니다.
3. 최종본과 작업본을 무분별하게 중복 저장하지 않습니다.
4. 변경 이력은 Git 커밋과 PR로 관리하며 `최종`, `진짜최종`, `최종수정2` 같은 이름을 사용하지 않습니다.
5. API·DB·화면 흐름이 변경되면 관련 문서를 같은 PR에서 함께 수정합니다.
6. 실제 개인정보, 운영 DB 백업, 비밀키, 인증서, 대용량 원본 영상은 올리지 않습니다.
