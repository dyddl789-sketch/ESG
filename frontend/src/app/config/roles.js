export const ROLES = Object.freeze({
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  COMPANY_MANAGER: "COMPANY_MANAGER",
  EXTERNAL_USER: "EXTERNAL_USER",
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.SYSTEM_ADMIN]: "시스템 총괄 관리자",
  [ROLES.COMPANY_MANAGER]: "기업 ESG 관리자",
  [ROLES.EXTERNAL_USER]: "일반 사용자",
});

export const ROLE_HOME = Object.freeze({
  [ROLES.SYSTEM_ADMIN]: "/manager/dashboard",
  [ROLES.COMPANY_MANAGER]: "/manager/dashboard",
  [ROLES.EXTERNAL_USER]: "/manager/dashboard",
});
