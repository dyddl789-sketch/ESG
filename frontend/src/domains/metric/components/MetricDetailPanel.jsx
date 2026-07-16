import { useState } from "react";
import Swal from "sweetalert2";
import Card from "../../../shared/components/Card";
import StatusBadge from "../../../shared/components/StatusBadge";
import { fileApi } from "../../../shared/api/fileApi";
import { apiErrorMessage, categoryLabel, formatDateTime, formatNumber } from "../../../shared/utils/esgFormat";

export default function MetricDetailPanel({ metric }) {
  const [downloading, setDownloading] = useState(false);
  const actual = metric.value === null || metric.value === undefined
    ? metric.textValue || "-"
    : `${formatNumber(metric.value, 4)} ${metric.unit || ""}`;

  const downloadEvidence = async () => {
    if (!metric.evidence || downloading) return;
    setDownloading(true);
    try {
      await fileApi.download(metric.evidence);
    } catch (error) {
      Swal.fire("증빙 다운로드 실패", apiErrorMessage(error), "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="detail-main">
      <Card title="지표 기본정보" description="ESG 데이터 관리에서 직접 등록한 사업장별 지표입니다.">
        <div className="detail-grid three">
          <div><span>ESG 영역</span><strong>{categoryLabel(metric.category)}</strong></div>
          <div><span>지표 코드</span><strong>{metric.indicatorCode}</strong></div>
          <div><span>기준월</span><strong>{metric.period}</strong></div>
          <div><span>사업장</span><strong>{metric.facility}</strong></div>
          <div><span>등록 방식</span><strong>{metric.method === "CALCULATION" ? "계산값" : "직접 등록"}</strong></div>
          <div><span>등록 담당자</span><strong>{metric.assignee || "-"}</strong></div>
        </div>
      </Card>

      <Card title="등록값 및 승인 상태">
        <div className="metric-actual-value">
          <div><span>등록값</span><strong>{actual}</strong></div>
          <div><span>승인 상태</span><StatusBadge status={metric.status} /></div>
          <div><span>최종 승인자</span><strong>{metric.approver || "-"}</strong></div>
        </div>
        {metric.textValue && <div className="reject-reason"><b>등록 메모</b><p>{metric.textValue}</p></div>}
        {metric.rejectReason && <div className="reject-reason"><b>반려 사유</b><p>{metric.rejectReason}</p></div>}
      </Card>

      <Card title="증빙자료" description="사업장 ESG 내역 PDF를 확인합니다.">
        <div className="file-row">
          <span>PDF</span>
          <div>
            <strong>{metric.evidence ? metric.evidence.split("/").pop() : "등록된 증빙자료 없음"}</strong>
            <small>증빙 파일은 권한 확인 후 서버에서 내려받습니다.</small>
          </div>
          <button type="button" disabled={!metric.evidence || downloading} onClick={downloadEvidence}>
            {downloading ? "다운로드 중" : "증빙 다운로드"}
          </button>
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
