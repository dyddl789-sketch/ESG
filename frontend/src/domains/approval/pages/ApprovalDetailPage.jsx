import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import MetricDetailPanel from "../../metric/components/MetricDetailPanel";
import { metricApi } from "../../metric/api/metricApi";
import approvalApi from "../api/approvalApi";
import { apiErrorMessage } from "../../../shared/utils/esgFormat";

export default function ApprovalDetailPage() {
  const { metricId } = useParams();
  const navigate = useNavigate();
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

  const approve = async () => {
    const result = await Swal.fire({ title: "최종 승인", text: "승인된 데이터는 확정값과 내부 ESG 관리지수 계산에 반영됩니다.", icon: "warning", showCancelButton: true, confirmButtonText: "최종 승인", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    setProcessing(true);
    try {
      await approvalApi.approve(metricId);
      await Swal.fire("최종 승인 완료", "확정 데이터로 처리되었습니다.", "success");
      navigate("/admin/approvals");
    } catch (error) { Swal.fire("승인 실패", apiErrorMessage(error), "error"); }
    finally { setProcessing(false); }
  };

  const reject = async () => {
    const result = await Swal.fire({ title: "반려 사유", input: "textarea", inputPlaceholder: "수정이 필요한 이유를 입력해 주세요.", showCancelButton: true, confirmButtonText: "반려", cancelButtonText: "취소", inputValidator: (value) => !value?.trim() ? "반려 사유를 입력해 주세요." : undefined });
    if (!result.isConfirmed) return;
    setProcessing(true);
    try {
      await approvalApi.reject(metricId, result.value.trim());
      await Swal.fire("반려 완료", "기업 ESG 관리자에게 반려 사유가 전달됩니다.", "success");
      navigate("/admin/approvals");
    } catch (error) { Swal.fire("반려 실패", apiErrorMessage(error), "error"); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="data-loading page-loading">승인 상세정보를 불러오는 중입니다.</div>;
  if (!metric) return <div className="empty-state"><strong>데이터를 찾을 수 없습니다.</strong></div>;

  return (
    <div className="page-stack">
      <PageHeader breadcrumbs={["승인 관리", metric.title]} title={`${metric.title} 승인 검토`} description={`${metric.facility} · ${metric.period}`} actions={<><Button variant="outline" onClick={() => navigate(-1)}>목록</Button><StatusBadge status={metric.status} /></>} />
      <div className="detail-layout">
        <MetricDetailPanel metric={metric} />
        <aside>
          <div className="action-card sticky-action-card">
            <h3>최종 검토</h3>
            <p>승인 시 해당 월의 승인 상태가 갱신되고 모든 지표 승인 완료 시 내부 ESG 지수와 대시보드가 확정됩니다.</p>
            {metric.status === "PENDING" ? <div className="action-stack"><Button variant="danger" disabled={processing} onClick={reject}>반려</Button><Button disabled={processing} onClick={approve}>최종 승인</Button></div> : <div className="readonly">현재 데이터는 승인 대기 상태가 아닙니다.</div>}
            <div className="approval-rule-note"><b>확정 반영 규칙</b><span>환경·사회·거버넌스 전체 지표가 승인 완료된 월만 대시보드 점수에 반영됩니다.</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
