import React from "react";

/**
 * [신규 생성] PerformancePage가 import하지만 실제 파일이 존재하지 않아
 * 프로젝트 전체 빌드가 실패하던 컴포넌트.
 * 실제 metrics 데이터를 기반으로 상단 요약 통계를 계산해 표시한다.
 */
export default function PerformanceStats({ metrics = [] }) {
  const list = Array.isArray(metrics) ? metrics : [];

  const total = list.length;
  const approved = list.filter((m) => m.status === "APPROVED").length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const pending = list.filter((m) => m.status === "PENDING").length;
  const rejected = list.filter((m) => m.status === "REJECTED").length;

  return (
    <div className="performance-cards">
      <article>
        <span>전체 관리 지표</span>
        <strong>{total}건</strong>
        <small>환경·사회·거버넌스 통합</small>
      </article>
      <article>
        <span>승인 완료율</span>
        <strong>{approvalRate}%</strong>
        <small>{approved}건 승인 완료</small>
      </article>
      <article>
        <span>승인 대기 / 반려</span>
        <strong>{pending} / {rejected}건</strong>
        <small>후속 조치가 필요한 데이터</small>
      </article>
    </div>
  );
}
