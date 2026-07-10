import React from "react";
import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function MetricSummaryPanel({ metrics = [] }) {
  // 아이콘을 변수에 담지 않고 렌더링 시점에 직접 사용
  const getCount = (status) => metrics.filter(m => m.status === status).length;
  const getCategoryCount = (cat) => metrics.filter(m => m.category === cat).length;

  return (
    <div className="metric-summary">
      <article>
        <span>환경 지표</span>
        <strong>{getCategoryCount("ENVIRONMENT")}건</strong>
        <small>전력 사용량·Scope 2</small>
      </article>
      <article>
        <span>사회 지표</span>
        <strong>{getCategoryCount("SOCIAL")}건</strong>
        <small>안전·교육·위험·퇴사</small>
      </article>
      <article>
        <span>거버넌스 지표</span>
        <strong>{getCategoryCount("GOVERNANCE")}건</strong>
        <small>이사회·사외이사·윤리</small>
      </article>
      <article>
        <span>승인 대기 / 반려</span>
        <strong>
          {getCount("PENDING")} / {getCount("REJECTED")}건
        </strong>
        <small>관리자 검토가 필요한 데이터</small>
      </article>
    </div>
  );
}
