| 구분 | 기술 |
| :--- | :--- |
| Frontend | React 19.2.7, Vite 8.1.3, React Router DOM, Axios, Chart.js, SweetAlert2, React-Quill-New, html2pdf.js |
| Backend | Java 17, Spring Boot 3.5.16, Spring Web, Spring Security, Validation, WebSocket, Actuator, Lombok |
| Persistence | MyBatis Framework, Flyway Migration |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Infrastructure | AWS EC2, RDS, S3, Nginx |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Collaboration | GitHub, Slack, Notion |
| Build / Env | Gradle Wrapper (Backend), Node.js 24.16.0 & npm 11.13.0 (Frontend) |

💡 프론트엔드 최초 실행 시 frontend 폴더로 이동하여 npm ci 로 환경을 세팅한 후 npm run dev 로 구동합니다. 백엔드의 기본 패키지 경로는 com.esg.platform 기준으로 동일하게 관리합니다.

# Frontend
## 실행 환경
- Node.js 24.16.0
- npm 11.13.0
## 핵심 라이브러리
- React 19.2.7
- React DOM 19.2.7
- Vite 8.1.3
- @vitejs/plugin-react 6.0.3
- React Router DOM 7.17.0
- Axios 1.18.0
- js-cookie 3.0.8
- SweetAlert2 11.26.25
- Chart.js 4.5.1
- react-chartjs-2 5.3.1
## 프로젝트 최초 실행
1. frontend 폴더 이동
2. npm ci
3. npm run dev

---
# Backend
- Java 17 - Spring Boot 3.5.16
- Spring Framework: Spring Boot 의존성 관리 버전 사용
- Gradle Wrapper
- PostgreSQL 16
- Redis
- 기본 패키지: com.esg.platform
## 주요 의존성
- Spring Web
- Spring Security
- Validation
- MyBatis Framework
- PostgreSQL Driver
- Flyway Migration
- Spring Data Redis
- WebSocket
- Spring Boot Actuator
- Lombok
- Spring Configuration Processor
- Spring Boot DevTools