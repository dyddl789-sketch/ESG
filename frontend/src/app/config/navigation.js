import { ROLES } from "./roles";

export const NAVIGATION = Object.freeze({
  [ROLES.COMPANY_MANAGER]: [
    { label: "개요", items: [
      { to: "/manager/dashboard", icon: "dashboard", label: "ESG 대시보드" },
    ]},
    { label: "데이터 관리", items: [
      { to: "/manager/integrations", icon: "sync", label: "환경" },
      { to: "/manager/social", icon: "users", label: "사회" },
      { to: "/manager/governance", icon: "approval", label: "거버넌스" },
      { to: "/manager/benchmarks", icon: "compare", label: "외부 데이터 비교" },
      { to: "/manager/metrics", icon: "database", label: "ESG 데이터 관리" },
      { to: "/manager/documents", icon: "document", label: "문서·AI 분석" },
    ]},
    { label: "성과·보고", items: [
      { to: "/manager/performance", icon: "chart", label: "ESG 실적 조회" },
      { to: "/manager/reports", icon: "report", label: "리포트 빌더" },
    ]},
    { label: "기업 설정", items: [
      { to: "/manager/company", icon: "company", label: "기업·사업장 정보" },
    ]},
  ],
  [ROLES.SYSTEM_ADMIN]: [
    { label: "개요", items: [
      { to: "/manager/dashboard", icon: "dashboard", label: "ESG 대시보드" },
    ]},
    { label: "데이터 관리", items: [
      { to: "/manager/integrations", icon: "sync", label: "환경" },
      { to: "/manager/social", icon: "users", label: "사회" },
      { to: "/manager/governance", icon: "approval", label: "거버넌스" },
      { to: "/manager/benchmarks", icon: "compare", label: "외부 데이터 비교" },
      { to: "/manager/metrics", icon: "database", label: "ESG 데이터 관리" },
      { to: "/manager/documents", icon: "document", label: "문서·AI 분석" },
    ]},
    { label: "성과·보고", items: [
      { to: "/manager/performance", icon: "chart", label: "ESG 실적 조회" },
      { to: "/manager/reports", icon: "report", label: "리포트 빌더" },
    ]},
    { label: "시스템 개요", items: [
      { to: "/admin/approvals", icon: "approval", label: "승인 관리", badgeKey: "pendingApprovals" },
    ]},
    { label: "플랫폼 관리", items: [
      { to: "/admin/companies", icon: "company", label: "기업 관리" },
      { to: "/admin/users", icon: "users", label: "사용자·권한 관리" },
    ]},
    { label: "운영 관리", items: [
      { to: "/admin/audit", icon: "audit", label: "감사 로그" },
    ]},
  ],
  [ROLES.EXTERNAL_USER]: [
    { label: "개요", items: [
      { to: "/manager/dashboard", icon: "dashboard", label: "ESG 대시보드" },
    ]},
    { label: "상세 데이터", items: [
      { to: "/manager/integrations", icon: "sync", label: "환경" },
      { to: "/manager/social", icon: "users", label: "사회" },
      { to: "/manager/governance", icon: "approval", label: "거버넌스" },
      { to: "/manager/benchmarks", icon: "compare", label: "외부 데이터 비교" },
    ]},
    { label: "성과·보고", items: [
      { to: "/public/compare", icon: "compare", label: "연도별 실적 비교" },
      { to: "/public/reports", icon: "report", label: "공개 보고서" },
    ]},
    { label: "기업 정보", items: [
      { to: "/manager/company", icon: "company", label: "기업·사업장 정보" },
    ]},
  ],
});
