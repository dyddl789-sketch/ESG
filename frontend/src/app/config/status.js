export const METRIC_STATUS = Object.freeze({
  COLLECTED: "COLLECTED",
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

export const STATUS_LABELS = Object.freeze({
  COLLECTED: "수집 완료",
  DRAFT: "검토 중",
  PENDING: "승인 대기",
  APPROVED: "승인 완료",
  REJECTED: "반려",
  NORMAL: "정상",
  DELAYED: "지연",
  ERROR: "오류",
  EMPTY: "미생성",
  READY: "준비 완료",
  WAITING: "수집 대기",
  PROCESSING: "처리 중",
  SUCCESS: "성공",
  PARTIAL: "일부 실패",
  COMPLETED: "수집 완료",
  INCOMPLETE: "수집 미완료",
  SYNCED: "동기화 완료",
});
