import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEsgData } from "../../../app/providers/EsgDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import StatusBadge from "../../../shared/components/StatusBadge";
import MetricDetailPanel from "../../metric/components/MetricDetailPanel";
import { metricApi } from "../../metric/api/metricApi";
import Swal from "sweetalert2";

export default function ApprovalDetailPage() {
  const { metricId } = useParams();
  const navigate = useNavigate();
  const { refreshMetrics } = useEsgData();
  const [metric, setMetric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await metricApi.detail(metricId);
        // [주의] MetricController.getMetricDetail은 객체를 직접 반환 (response.data)
        setMetric(response.data);
      } catch (err) {
        console.error("상세 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [metricId]);

  const handleDecide = async (decision) => {
    let comment = "";
    
    if (decision === "REJECTED") {
      const { value: text, isDismissed } = await Swal.fire({
        title: "반려 사유 입력",
        input: "textarea",
        inputPlaceholder: "반려 사유를 입력해주세요...",
        showCancelButton: true,
        confirmButtonText: "반려 처리",
        cancelButtonText: "취소",
        confirmButtonColor: "#d14b43"
      });
      
      if (isDismissed) return;
      if (!text) return Swal.fire("알림", "반려 사유를 입력해야 합니다.", "warning");
      comment = text;
    } else {
      const result = await Swal.fire({
        title: "최종 승인",
        text: "이 데이터를 최종 승인하시겠습니까?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "승인",
        cancelButtonColor: "#666",
        confirmButtonColor: "#1f6b46"
      });
      if (!result.isConfirmed) return;
    }

    setSubmitting(true);
    try {
      await metricApi.decide(metric.id, decision, comment);
      await Swal.fire("완료", decision === "APPROVED" ? "승인되었습니다." : "반려되었습니다.", "success");
      refreshMetrics(); // 목록 캐시 갱신
      navigate("/admin/approvals");
    } catch (err) {
      console.error("결재 처리 실패:", err);
      Swal.fire("오류", "처리에 실패했습니다.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-stack"><p style={{ padding: "40px", textAlign: "center" }}>데이터를 불러오는 중입니다...</p></div>;
  if (!metric) return <div className="page-stack"><p style={{ padding: "40px", textAlign: "center" }}>데이터를 찾을 수 없습니다.</p></div>;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["승인 관리", metric.title]}
        title={`${metric.title} 승인 검토`}
        description={`${metric.facility || "본사"} · ${metric.reportingYear}년 ${metric.periodValue}${metric.periodType === "MONTHLY" ? "월" : "분기"}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>목록</Button>
            <StatusBadge status={metric.status} />
          </>
        }
      />

      <div className="detail-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
        <MetricDetailPanel metric={metric} />
        
        <aside>
          <Card title="최종 검토">
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
              승인 시 외부 공개 대시보드와 보고서 집계에 즉시 반영됩니다.
            </p>
            <div className="action-stack" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Button 
                variant="danger" 
                onClick={() => handleDecide("REJECTED")}
                disabled={submitting || metric.status !== "PENDING"}
              >
                반려
              </Button>
              <Button 
                onClick={() => handleDecide("APPROVED")}
                disabled={submitting || metric.status !== "PENDING"}
              >
                최종 승인
              </Button>
            </div>
            {metric.status !== "PENDING" && (
              <p style={{ marginTop: "10px", fontSize: "12px", color: "#d14b43", textAlign: "center" }}>
                이미 처리가 완료된 데이터입니다.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
