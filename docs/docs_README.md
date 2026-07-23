# ESG 프로젝트 문서 폴더 사용 가이드

이 문서는 팀원이 `docs/` 아래에 어떤 문서를 어디에 저장해야 하는지 통일하기 위한 기준입니다.

---

## 1. 문서 관리 기본 원칙

- 문서는 내용의 목적에 맞는 폴더에 저장합니다.
- 파일명만 보고도 문서 종류와 내용을 알 수 있어야 합니다.
- 같은 문서를 여러 폴더에 복사하지 않고 원본 위치를 하나로 유지합니다.
- 문서 변경은 별도 `docs/*` 브랜치 또는 기능 브랜치에서 코드 변경과 함께 처리할 수 있습니다.
- API, DB, 권한, 화면 흐름이 변경되면 관련 문서를 반드시 함께 수정합니다.
- `최종`, `진짜최종`, `최종수정`, `복사본` 같은 이름 대신 Git 이력과 릴리스 버전을 사용합니다.

---

## 2. 권장 문서 구조

docs/  
├── README.md  
├── [01-planning](https://github.com/dyddl789-sketch/ESG/tree/feature/docs/docs/01-planning)/  
├── [02-design](https://github.com/dyddl789-sketch/ESG/tree/feature/docs/docs/02-design)/  
├── [03-api](https://github.com/dyddl789-sketch/ESG/tree/feature/docs/docs/03-api)/  
├── [04-test](https://github.com/dyddl789-sketch/ESG/tree/feature/docs/docs/04-test)/  
├── [05-presentation](https://github.com/dyddl789-sketch/ESG/tree/feature/docs/docs/05-presentation)/  
└── [meeting-notes](https://github.com/dyddl789-sketch/ESG/tree/feature/docs/docs/meeting-notes)/  

각 폴더에는 문서 목록을 빠르게 확인할 수 있도록 필요할 경우 `README.md` 또는 `INDEX.md`를 둡니다.

---

## 3. 폴더별 저장 기준

## 3.1 `01-planning` — 기획 및 프로젝트 관리

프로젝트를 왜 만들고, 무엇을 만들며, 누가 언제까지 담당하는지 정리합니다.

### 저장할 문서

- 프로젝트 제안서 및 개요
- 사용자 요구사항 정의서
- 기능 요구사항·비기능 요구사항
- 프로젝트 범위와 MVP 정의
- WBS 및 개발 일정
- 팀원 역할 분담표
- 메뉴 구조도
- 사용자 권한 정의
- 유스케이스 목록
- 데이터 수집 시나리오
- 기술 선정 근거
- 리스크 및 대응 계획

### 파일 예시

```text
01-planning/
├── project-overview.md
├── requirements.md
├── mvp-scope.md
├── wbs.xlsx
├── team-roles.md
├── menu-structure.xlsx
├── role-definition.md
└── data-collection-scenario.md
```

### 넣지 않는 문서

- 화면설계서와 ERD → `02-design`
- API 요청·응답 명세 → `03-api`
- 테스트 결과 → `04-test`

---

## 3.2 `02-design` — 시스템 및 화면 설계

구현 전에 시스템이 어떻게 동작하고 연결되는지 시각화하고 상세 설계를 관리합니다.

### 저장할 문서

- ESG 업무흐름도
- 시스템 아키텍처
- 배포 아키텍처
- 데이터 수집·승인 흐름도
- ERD
- 테이블 정의서
- Redis Key 설계서
- 화면설계서
- 와이어프레임
- 메뉴별 화면 흐름
- 권한별 화면·버튼 정의
- 시퀀스 다이어그램
- 파일 저장 및 S3 연동 설계
- AI 문서 분석 처리 흐름

### 파일 예시

```text
02-design/
├── esg-business-workflow.png
├── system-architecture.png
├── deployment-architecture.png
├── erd.png
├── database-design.xlsx
├── redis-key-design.md
├── screen-design.pdf
├── role-screen-matrix.xlsx
└── ai-document-analysis-flow.md
```

### 이미지 관리 권장

```text
02-design/images/
├── workflow/
├── architecture/
├── erd/
└── screens/
```

문서에서 이미지를 사용할 때는 가능한 한 상대경로로 연결합니다.

```md
![ESG 업무흐름도](./images/workflow/esg-business-workflow.png)
```

---

## 3.3 `03-api` — API 및 외부 연동 명세

Frontend와 Backend가 동일한 요청·응답 구조를 사용하도록 계약을 관리합니다.

### 저장할 문서

- 전체 API 목록
- 인증·인가 API 명세
- 기업·사용자 관리 API
- ESG 데이터 수집 API
- 승인·반려 API
- 대시보드 API
- 보고서 API
- 파일 업로드 API
- EMS·인사·안전·그룹웨어 연동 명세
- 오류 코드 및 공통 응답 형식
- Postman Collection 사용 안내
- API 변경 이력

### 파일 예시

```text
03-api/
├── api-overview.md
├── common-response.md
├── error-codes.md
├── auth-api.md
├── integration-api.md
├── metric-api.md
├── approval-api.md
├── dashboard-api.md
├── report-api.md
└── postman/
    ├── ESG-Platform.postman_collection.json
    └── local.postman_environment.example.json
```

### API 문서 최소 항목

```text
기능명
HTTP Method
URL
요청 권한
Path / Query Parameter
Request Body
Response Body
성공 코드
오류 코드
비고
```

### 보안 주의

Postman 실제 환경파일에 API Key나 토큰이 들어 있다면 업로드하지 않습니다. 값이 비어 있는 예제 파일만 공유합니다.

---

## 3.4 `04-test` — 테스트 및 품질 관리

요구사항이 실제로 정상 동작하는지 검증한 기록을 저장합니다.

### 저장할 문서

- 테스트 계획서
- 기능별 테스트 케이스
- 권한별 접근 테스트
- API 테스트 결과
- DB 마이그레이션 테스트 결과
- 통합 테스트 결과
- Docker 실행 테스트
- AWS 배포 확인 결과
- 브라우저 호환성 테스트
- 성능·보안 테스트
- 버그 및 QA 이력
- 사용자 인수 테스트 결과

### 파일 예시

```text
04-test/
├── test-plan.md
├── test-cases.xlsx
├── api-test-result.md
├── role-access-test.xlsx
├── integration-test-result.md
├── docker-deployment-test.md
├── aws-deployment-checklist.md
├── qa-issues.xlsx
└── screenshots/
```

### 테스트 케이스 최소 항목

```text
테스트 ID
기능
사전 조건
입력값
실행 절차
예상 결과
실제 결과
통과 여부
테스트 담당자
테스트 일시
비고
```

---

## 3.5 `05-presentation` — 발표 및 시연 자료

최종 발표와 시연에 필요한 자료를 관리합니다.

### 저장할 문서

- 중간·최종 발표 PPT
- 발표 대본
- 시연 시나리오
- 슬라이드별 이미지·코드 배치표
- 발표용 시스템 구조도
- 주요 화면 캡처
- 시연 영상 링크 문서
- 예상 질문과 답변
- 최종 제출 파일 목록

### 파일 예시

```text
05-presentation/
├── final-presentation.pptx
├── final-script.md
├── demo-scenario.md
├── slide-image-map.xlsx
├── expected-questions.md
├── screenshots/
└── video-links.md
```

### 대용량 파일 주의

큰 영상 파일은 GitHub 저장소에 직접 올리지 않고 GitHub Release, Drive, S3 등 외부 저장소에 올린 뒤 링크를 문서에 기록합니다.

---

## 3.6 `meeting-notes` — 회의록 및 결정사항

회의에서 결정된 사항과 담당 업무를 날짜별로 남깁니다.

### 저장할 내용

- 회의 날짜·시간
- 참석자
- 논의 안건
- 결정사항
- 미결사항
- 담당자별 할 일
- 완료 예정일
- 다음 회의 일정

### 파일 이름 규칙

```text
YYYY-MM-DD_회의주제.md
```

### 파일 예시

```text
meeting-notes/
├── 2026-07-07_kickoff.md
├── 2026-07-10_database-design.md
└── 2026-07-14_frontend-review.md
```

### 회의록 템플릿

```md
# 회의 제목

- 일시:
- 참석자:
- 작성자:

## 논의 안건

1.
2.

## 결정사항

- 

## 작업 항목

| 작업 | 담당자 | 완료 예정일 | 상태 |
|---|---|---|---|
|  |  |  | 예정 |

## 미결사항

- 

## 다음 회의

- 일시:
- 안건:
```

---

## 4. 파일명 작성 규칙

영문 소문자와 하이픈 사용을 권장합니다.

```text
requirements.md
system-architecture.png
approval-api.md
role-access-test.xlsx
final-presentation.pptx
```

날짜가 중요한 문서는 앞에 날짜를 붙입니다.

```text
2026-07-07_kickoff.md
20260707_01_api-change.md
```

한글 파일명도 사용할 수 있지만, Docker·Linux·CI 환경과 링크 안정성을 고려하면 영문 파일명을 우선 권장합니다.

---

## 5. 버전 및 최종본 관리

### 사용하지 않는 이름

```text
최종.pptx
진짜최종.pptx
최종수정2.pptx
새폴더/복사본.md
```

### 권장 방법

- 작업 과정은 Git 커밋으로 관리합니다.
- 발표 배포본만 명시적 버전을 사용합니다.

```text
esg-presentation-v1.0.pptx
esg-screen-design-v1.1.pdf
```

- 동일 문서의 원본과 PDF가 모두 필요하면 확장자만 구분합니다.

```text
screen-design.odp
screen-design.pdf
```

---

## 6. GitHub에 올리면 안 되는 문서와 자료

```text
실제 개인정보가 포함된 Excel·PDF
실제 운영 DB 백업
AWS Access Key와 Secret Key
JWT Secret
외부 API 비밀키
PEM·SSH 개인키
실제 .env 파일
로그 전체 덤프
node_modules 및 dist
대용량 원본 영상
라이선스가 불명확한 이미지·문서
```

민감정보가 들어간 파일을 이미 Push했다면 파일만 삭제하지 말고 해당 키를 폐기·재발급하고 Git 이력도 정리해야 합니다.

---

## 7. 문서 변경 작업 절차

```bash
git switch develop
git pull origin develop
git switch -c docs/이슈번호-문서명
```

문서 작성 후:

```bash
git add docs README.md
git status
git commit -m "docs: API 명세 및 문서 구조 가이드 추가"
git push -u origin docs/이슈번호-문서명
```

PR 방향:

```text
docs/* → develop
```

코드 변경과 직접 관련된 문서는 해당 기능 브랜치에서 함께 수정해도 됩니다.

---

## 8. 문서 완료 기준

- 올바른 폴더에 저장했는가
- 파일명이 내용을 명확히 설명하는가
- 최신 구현 내용과 일치하는가
- 문서 내부 링크와 이미지가 정상적으로 열리는가
- 담당자·날짜·버전이 필요한 경우 기록했는가
- 민감정보가 포함되지 않았는가
- 같은 문서의 불필요한 복사본이 없는가
- 관련 PR 설명에 문서 변경 내용을 적었는가
