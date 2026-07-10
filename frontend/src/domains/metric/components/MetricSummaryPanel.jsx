import React from "react";

export default function MetricSummaryPanel({ metrics = [] }) {
  return (
    <div className="metric-summary">
      <article>
        <span>환경 지표</span>
        <strong>{metrics.filter((item) => item.category === "ENVIRONMENT").length}건</strong>
        <small>전력 사용량·Scope 2</small>
      </article>
      <article>
        <span>사회 지표</span>
        <strong>{metrics.filter((item) => item.category === "SOCIAL").length}건</strong>
        <small>안전·교육·위험·퇴사</small>
      </article>
      <article>
        <span>거버넌스 지표</span>
        <strong>{metrics.filter((item) => item.category === "GOVERNANCE").length}건</strong>
        <small>이사회·사외이사·윤리</small>
      </article>
      <article>
        <span>승인 대기 / 반려</span>
        <strong>
          {metrics.filter((item) => item.status === "PENDING").length} / {metrics.filter((item) => item.status === "REJECTED").length}건
        </strong>
        <small>관리자 검토가 필요한 데이터</small>
      </article>
    </div>
  );
}
