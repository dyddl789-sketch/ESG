import React from "react";
// [핵심 수정] lucide-react는 package.json에 없는 미설치 패키지라 import 시 빌드가 깨졌다.
// 실제로 아이콘을 렌더링에 사용하지도 않았으므로 import 자체를 제거했다.
// (아이콘이 필요하면 `pnpm add lucide-react` 후 다시 추가할 것)

export default function MetricSummaryPanel({ metrics = [] }) {
  const list = Array.isArray(metrics) ? metrics : [];
  const getCount = (status) => list.filter((m) => m.status === status).length;
  const getCategoryCount = (cat) => list.filter((m) => m.category === cat).length;

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
