import { useNavigate, useParams } from "react-router-dom";
import { useEsgData } from "../../../app/providers/EsgDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import MetricDetailPanel from "../components/MetricDetailPanel";

export default function MetricDetailPage() {
  const { metricId } = useParams();
  const nav = useNavigate();
  // [수정] EsgDataProvider에서 loading까지 받아 로딩/미존재를 구분
  //  - 기존에는 데이터 로딩이 끝나기 전에 "데이터를 찾을 수 없습니다"가 먼저 떴다.
  const { metrics, loading, requestApproval } = useEsgData();

  const metric = metrics.find((m) => Number(m.id) === Number(metricId));

  if (loading) {
    return <p className="p-10 text-center">데이터를 불러오는 중입니다...</p>;
  }

  if (!metric) {
    return (
      <div className="page-stack">
        <p className="p-10 text-center">데이터를 찾을 수 없습니다. (ID: {metricId})</p>
        <div style={{ textAlign: "center" }}>
          <Button variant="outline" onClick={() => nav(-1)}>목록으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const canRequest = ["DRAFT", "REJECTED", "COLLECTED"].includes(metric.status);

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["ESG 데이터 관리", metric.title]}
        title={metric.title}
        description={`${metric.facility ?? ""} · ${metric.period ?? ""}`}
        actions={
          <>
            <Button variant="outline" onClick={() => nav(-1)}>목록</Button>
            <StatusBadge status={metric.status} />
          </>
        }
      />
      <div className="detail-layout">
        <MetricDetailPanel metric={metric} />
        <aside>
          <div className="action-card">
            <h3>업무 처리</h3>
            <p>기업 ESG 관리자가 검토를 완료하면 시스템 총괄 관리자에게 최종 승인을 요청합니다.</p>
            <Button
              className="full"
              disabled={!canRequest}
              onClick={() => requestApproval(metric.id)}
            >
              승인 요청
            </Button>
            {metric.status === "PENDING" && <div className="readonly">현재 시스템 관리자 승인 대기 상태입니다.</div>}
            {metric.status === "APPROVED" && <div className="approved-note">승인 데이터는 수정이 잠기고 공개 화면에 반영됩니다.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
