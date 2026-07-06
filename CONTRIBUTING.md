# ESG 프로젝트 협업 규칙

이 문서는 팀원이 동일한 방식으로 개발·리뷰·병합할 수 있도록 정한 세부 규칙입니다.  
핵심 내용은 저장소의 `README.md`에서도 바로 확인할 수 있습니다.

---

## 1. 공통 개발 환경

| 항목 | 기준 |
|---|---|
| Backend IDE | IntelliJ IDEA 또는 STS 자유 |
| Frontend IDE | VS Code 권장, 다른 IDE 사용 가능 |
| Java | 17 |
| Build | Gradle Wrapper |
| Node.js | 팀에서 확정한 LTS 버전 |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Character Set | UTF-8 |
| Line Ending | LF |
| API 형식 | JSON |
| Time Zone | Asia/Seoul 기준, DB 저장 정책은 팀에서 통일 |

IDE가 달라도 다음 명령이 성공해야 합니다.

```bash
# Windows
gradlew.bat clean build

# macOS / Linux
./gradlew clean build
```

---

## 2. Git 작업 절차

### 2.1 작업 전

```bash
git switch develop
git pull origin develop
git switch -c feature/이슈번호-기능명
```

### 2.2 작업 중

- 의미 있는 작업 단위로 커밋합니다.
- 다른 팀원의 작업 파일을 이유 없이 함께 수정하지 않습니다.
- 대량 포맷 변경은 기능 개발 PR과 분리합니다.

### 2.3 작업 완료

```bash
git add .
git status
git commit -m "feat: 환경 데이터 등록 기능 구현"
git push -u origin feature/이슈번호-기능명
```

### 2.4 PR

```text
feature/* → develop
develop → main
```

- 충돌 해결 후 로컬 빌드를 다시 확인합니다.
- 리뷰 의견은 임의로 무시하지 않고 답변 또는 수정합니다.
- Merge 후 사용이 끝난 기능 브랜치는 삭제합니다.

---

## 3. 브랜치 이름

```text
feature/12-environment-data
fix/21-dashboard-chart
refactor/32-approval-service
docs/7-screen-design
infra/16-aws-deploy
```

영문 소문자와 하이픈 사용을 권장합니다.

---

## 4. 커밋 규칙

```text
<type>: <작업 내용>
```

예시:

```text
feat: 환경 데이터 등록 API 구현
fix: 승인 완료 후 버튼 상태 오류 수정
refactor: ESG 점수 계산 로직 분리
docs: ERD 문서 추가
test: 환경 데이터 서비스 단위 테스트 추가
chore: 불필요한 주석 정리
build: PostgreSQL 드라이버 추가
ci: 백엔드 빌드 워크플로 추가
infra: Nginx 리버스 프록시 설정
```

한 커밋에 기능 추가와 전체 파일 포맷 변경을 함께 넣지 않습니다.

---

## 5. 도메인 패키지 규칙

### 5.1 백엔드

```text
com.esg.platform
├── global
└── domain
    ├── auth
    ├── member
    ├── environment
    ├── social
    ├── governance
    ├── approval
    ├── dashboard
    ├── report
    ├── notification
    └── admin
```

도메인 내부:

```text
domain/environment
├── controller
├── service
├── mapper 또는 repository
├── entity
├── dto
│   ├── request
│   └── response
└── exception
```

#### 규칙

- Controller는 요청·검증·응답만 담당합니다.
- 비즈니스 로직은 Service에 작성합니다.
- Controller에서 Mapper/Repository를 직접 호출하지 않습니다.
- Entity를 API 응답으로 직접 반환하지 않습니다.
- Request DTO와 Response DTO를 분리합니다.
- 공통 예외 응답은 `global/exception`, 도메인 전용 예외는 해당 도메인에 둡니다.
- 여러 도메인의 기능을 조합하는 로직은 담당 Service 또는 별도 Facade에서 처리합니다.

### 5.2 프론트엔드

```text
src/
├── app
├── layouts
├── domains
│   ├── auth
│   ├── environment
│   ├── social
│   ├── governance
│   ├── approval
│   ├── dashboard
│   ├── report
│   └── admin
└── shared
```

도메인 내부:

```text
domains/environment/
├── api
├── components
├── hooks
├── pages
├── store
└── utils
```

#### 규칙

- 특정 기능 전용 코드는 해당 도메인 안에 둡니다.
- 실제로 둘 이상의 도메인에서 재사용하는 코드만 `shared`로 이동합니다.
- 페이지 컴포넌트는 API 상세 처리보다 화면 조합에 집중합니다.
- API 요청 코드는 도메인별 `api` 폴더로 분리합니다.
- 공통 Axios 인스턴스는 `shared/api`에 둡니다.

---

## 6. API 규칙

- 기본 경로: `/api`
- URL은 소문자와 복수 명사를 사용합니다.
- HTTP 메서드 의미를 따릅니다.

```text
GET    /api/environment-data
GET    /api/environment-data/{id}
POST   /api/environment-data
PUT    /api/environment-data/{id}
DELETE /api/environment-data/{id}
```

- 성공·오류 응답 형식을 프로젝트 전체에서 통일합니다.
- 요청값 검증은 Backend에서 반드시 수행합니다.
- API 변경 시 `docs/03-api` 문서를 함께 수정합니다.

---

## 7. DB 규칙

- 테이블과 컬럼은 `snake_case`
- 기본키는 의미 있는 이름 사용
- 외래키와 인덱스 이름도 규칙적으로 작성
- 개발 중 DB를 직접 수정했더라도 SQL 파일을 반드시 남김
- 공유된 migration 파일은 수정하지 않고 새 파일을 추가

```text
database/migration/20260707_01_add_member_role.sql
database/migration/20260707_02_add_approval_history.sql
```

- 개인정보와 실제 운영 DB 백업은 커밋 금지
- 샘플 데이터는 가상의 값만 사용

---

## 8. 코드 리뷰 기준

리뷰어는 다음을 확인합니다.

- 요구사항과 실제 구현이 일치하는가
- 도메인 책임이 적절히 분리됐는가
- Controller에 비즈니스 로직이 들어가 있지 않은가
- 중복 코드가 과도하지 않은가
- 예외처리와 입력 검증이 있는가
- 민감정보가 포함되지 않았는가
- 기존 기능이 깨지지 않는가
- DB 변경과 API 변경 문서가 반영됐는가

리뷰 의견 표현:

```text
[필수] 병합 전 반드시 수정
[제안] 더 나은 방법 제안
[질문] 구현 의도 확인
[참고] 추후 개선 가능
```

---

## 9. PR 작성 규칙

PR 제목:

```text
feat: 환경 데이터 등록 기능 구현
fix: ESG 대시보드 기간 조회 오류 수정
infra: AWS EC2 배포 환경 구성
```

PR 본문에는 다음 내용을 포함합니다.

- 작업 내용
- 관련 Issue
- 변경된 API 또는 DB
- 테스트 방법과 결과
- 화면 변경 스크린샷
- 환경변수 추가 여부
- 리뷰어가 집중해서 볼 부분

---

## 10. 보안 규칙

다음은 GitHub, Slack, Notion에 그대로 올리지 않습니다.

```text
AWS Access Key
AWS Secret Access Key
DB 비밀번호
JWT Secret
OAuth Client Secret
외부 API Key
PEM 및 SSH 개인키
실제 개인정보
운영 DB 백업
```

이미 커밋했다면 단순 삭제만 하지 말고 즉시 키를 폐기·재발급하고 Git 이력 정리를 진행합니다.

---

## 11. 완료 기준

기능 완료는 단순히 화면이 보이는 상태가 아닙니다.

- 요구사항 구현 완료
- 입력 검증 및 예외처리 완료
- API 연동 완료
- DB 변경 SQL 반영
- 로컬 빌드 성공
- 주요 시나리오 테스트 완료
- 문서 또는 API 명세 갱신
- PR 리뷰 완료
- `develop` 병합 완료

`main` 병합 전에는 통합 실행과 배포 환경 테스트를 진행합니다.
