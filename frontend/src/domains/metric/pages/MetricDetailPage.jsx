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

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const requestApproval = async () => {
    const result = await Swal.fire({ title: "최종 승인 요청", text: "등록값과 증빙자료를 시스템 총괄 관리자에게 제출합니다.", icon: "question", showCancelButton: true, confirmButtonText: "승인 요청", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    setProcessing(true);
    try {
      setMetric(await metricApi.requestApproval(metricId));
      await Swal.fire("승인 요청 완료", "승인 관리 화면에 대기 건으로 등록되었습니다.", "success");
    } catch (error) { Swal.fire("요청 실패", apiErrorMessage(error), "error"); }
    finally { setProcessing(false); }
  };

  const remove = async () => {
    const result = await Swal.fire({ title: "반려 데이터 삭제", text: "반려된 실적을 영구 삭제합니다.", icon: "warning", showCancelButton: true, confirmButtonText: "삭제", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    setProcessing(true);
    try {
      await metricApi.remove(metricId);
      await Swal.fire("삭제 완료", "반려 데이터가 삭제되었습니다.", "success");
      navigate("/manager/metrics");
    } catch (error) { Swal.fire("삭제 실패", apiErrorMessage(error), "error"); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="data-loading page-loading">지표 상세정보를 불러오는 중입니다.</div>;
  if (!metric) return <div className="empty-state"><strong>데이터를 찾을 수 없습니다.</strong></div>;

  const editable = user?.role === ROLES.COMPANY_MANAGER && ["DRAFT", "REJECTED"].includes(metric.status);
  const canRequest = editable && Boolean(metric.evidence);

  return (
    <div className="page-stack">
      <PageHeader breadcrumbs={["ESG 데이터 관리", metric.title]} title={metric.title} description={`${metric.facility} · ${metric.period}`} actions={<><Button variant="outline" onClick={() => navigate(-1)}>목록</Button><StatusBadge status={metric.status} /></>} />
      <div className="detail-layout">
        <MetricDetailPanel metric={metric} />
        <aside>
          <div className="action-card sticky-action-card">
            <h3>업무 처리</h3>
            <p>등록값과 사업장 ESG 내역 PDF를 확인한 뒤 최종 승인을 요청합니다.</p>
            {editable && <Button className="full" variant="outline" disabled={processing} onClick={() => navigate(`/manager/metrics/${metric.id}/edit`)}>실적 내용 수정</Button>}
            {user?.role === ROLES.COMPANY_MANAGER && <Button className="full" disabled={!canRequest || processing} onClick={requestApproval}>승인 요청</Button>}
            {metric.status === "REJECTED" && user?.role === ROLES.COMPANY_MANAGER && <Button className="full" variant="danger" disabled={processing} onClick={remove}>반려 데이터 삭제</Button>}
            {editable && !metric.evidence && <div className="readonly">승인 요청 전에 PDF 증빙을 등록해 주세요.</div>}
            {metric.status === "PENDING" && <div className="readonly">현재 시스템 관리자 최종 승인 대기 상태입니다.</div>}
            {metric.status === "APPROVED" && <div className="approved-note">최종 승인된 값은 사업장 상세, E·S·G 조회 화면과 통합 대시보드에 자동 반영됩니다.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
