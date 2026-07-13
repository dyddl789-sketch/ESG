import Card from "../../../shared/components/Card";
import StatusBadge from "../../../shared/components/StatusBadge";
import { categoryLabel, formatDateTime, formatNumber } from "../../../shared/utils/esgFormat";

export default function MetricDetailPanel({ metric }) {
  const actual = metric.value === null || metric.value === undefined
    ? metric.textValue || "-"
    : `${formatNumber(metric.value, 4)} ${metric.unit || ""}`;

  return (
    <div className="detail-main">
      <Card title="지표 기본정보" description="영역별 ESG 반영으로 생성된 실제 DB 지표입니다.">
        <div className="detail-grid three">
          <div><span>ESG 영역</span><strong>{categoryLabel(metric.category)}</strong></div>
          <div><span>지표 코드</span><strong>{metric.indicatorCode}</strong></div>
          <div><span>기준월</span><strong>{metric.period}</strong></div>
          <div><span>사업장</span><strong>{metric.facility}</strong></div>
          <div><span>원천 시스템</span><strong>{metric.source || metric.method || "-"}</strong></div>
          <div><span>담당자</span><strong>{metric.assignee || "시스템 자동 반영"}</strong></div>
        </div>
      </Card>

      <Card title="실제값 및 검증 상태">
        <div className="metric-actual-value">
          <div><span>현재 실제값</span><strong>{actual}</strong></div>
          <div><span>승인 상태</span><StatusBadge status={metric.status} /></div>
          <div><span>AI 위험수준</span><StatusBadge status={metric.risk} label={metric.risk === "HIGH" ? "높음" : metric.risk === "MEDIUM" ? "보통" : "낮음"} /></div>
        </div>
        {metric.rejectReason && <div className="reject-reason"><b>반려 사유</b><p>{metric.rejectReason}</p></div>}
      </Card>

      <Card title="AI 사전 분석" description="AI는 이상치와 누락 여부를 제안하며 승인 판단을 대신하지 않습니다.">
        {metric.aiStatus === "COMPLETED" ? (
          <div className={`ai-review-box risk-${String(metric.risk).toLowerCase()}`}>
            <div><StatusBadge status={metric.aiStatus} label="분석 완료" /><span>{metric.aiModel || "RULE ENGINE"}</span></div>
            <p>{metric.aiFinding || "특이사항이 없습니다."}</p>
          </div>
        ) : (
          <div className="empty-state"><strong>AI 분석 전</strong><p>승인 요청 전에 AI 사전 분석을 실행해 주세요.</p></div>
        )}
      </Card>

      <Card title="증빙자료">
        <div className="file-row">
          <span>FILE</span>
          <div><strong>{metric.evidence || "등록된 증빙자료 없음"}</strong><small>원천 시스템 연결정보와 증빙 파일을 확인합니다.</small></div>
          <button type="button" disabled={!metric.evidence}>원문 보기</button>
        </div>
      </Card>

      <Card title="처리 이력">
        <div className="timeline">
          {(metric.history || []).map((history) => (
            <div key={history.id}><i /><section><strong>{history.actionType}</strong><span>{history.actorName} · {formatDateTime(history.actedAt)}</span><p>{history.comment || `${history.fromStatus || "생성"} → ${history.toStatus}`}</p></section></div>
          ))}
          {(!metric.history || metric.history.length === 0) && <div className="empty-state"><strong>처리 이력 없음</strong></div>}
        </div>
      </Card>
    </div>
  );
}
