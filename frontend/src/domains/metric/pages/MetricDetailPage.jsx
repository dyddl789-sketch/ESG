import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import PageHeader from "../../../shared/components/PageHeader";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import MetricDetailPanel from "../components/MetricDetailPanel";
import { metricApi } from "../api/metricApi";
import { apiErrorMessage } from "../../../shared/utils/esgFormat";

export default function MetricDetailPage() {
  const { metricId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [metric, setMetric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setMetric(await metricApi.detail(metricId)); }
    catch (error) { Swal.fire("조회 실패", apiErrorMessage(error), "error"); }
    finally { setLoading(false); }
  }, [metricId]);

  useEffect(() => { load(); }, [load]);

  const analyze = async () => {
    setProcessing(true);
    try {
      setMetric(await metricApi.analyze(metricId));
      Swal.fire("AI 분석 완료", "이상치·누락·내부 관리기준을 검토했습니다.", "success");
    } catch (error) { Swal.fire("분석 실패", apiErrorMessage(error), "error"); }
    finally { setProcessing(false); }
  };

  const requestApproval = async () => {
    const result = await Swal.fire({ title: "최종 승인 요청", text: "시스템 총괄 관리자에게 이 지표의 최종 승인을 요청합니다.", icon: "question", showCancelButton: true, confirmButtonText: "승인 요청", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    setProcessing(true);
    try {
      setMetric(await metricApi.requestApproval(metricId));
      Swal.fire("승인 요청 완료", "승인 관리 화면에 대기 건으로 등록되었습니다.", "success");
    } catch (error) { Swal.fire("요청 실패", apiErrorMessage(error), "error"); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="data-loading page-loading">지표 상세정보를 불러오는 중입니다.</div>;
  if (!metric) return <div className="empty-state"><strong>데이터를 찾을 수 없습니다.</strong></div>;

  const canAnalyze = [ROLES.COMPANY_MANAGER, ROLES.SYSTEM_ADMIN].includes(user?.role) && ["DRAFT", "REJECTED"].includes(metric.status);
  const canRequest = user?.role === ROLES.COMPANY_MANAGER && ["DRAFT", "REJECTED"].includes(metric.status) && metric.aiStatus === "COMPLETED";

  return (
    <div className="page-stack">
      <PageHeader breadcrumbs={["ESG 데이터 관리", metric.title]} title={metric.title} description={`${metric.facility} · ${metric.period}`} actions={<><Button variant="outline" onClick={() => navigate(-1)}>목록</Button><StatusBadge status={metric.status} /></>} />
      <div className="detail-layout">
        <MetricDetailPanel metric={metric} />
        <aside>
          <div className="action-card sticky-action-card">
            <h3>업무 처리</h3>
            <p>실제값과 증빙을 확인한 뒤 AI 분석을 실행하고 최종 승인을 요청합니다.</p>
            <Button className="full" variant="outline" disabled={!canAnalyze || processing} onClick={analyze}>{processing ? "처리 중..." : metric.aiStatus === "COMPLETED" ? "AI 다시 분석" : "AI 사전 분석"}</Button>
            {user?.role === ROLES.COMPANY_MANAGER && <Button className="full" disabled={!canRequest || processing} onClick={requestApproval}>승인 요청</Button>}
            {metric.aiStatus !== "COMPLETED" && ["DRAFT", "REJECTED"].includes(metric.status) && <div className="readonly">승인 요청 전에 AI 분석이 필요합니다.</div>}
            {metric.status === "PENDING" && <div className="readonly">현재 시스템 관리자 최종 승인 대기 상태입니다.</div>}
            {metric.status === "APPROVED" && <div className="approved-note">최종 승인된 값은 ESG 대시보드와 보고서에 확정 반영됩니다.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
