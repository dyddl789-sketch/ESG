import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEsgData } from "../../../app/providers/EsgDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import MetricDetailPanel from "../components/MetricDetailPanel";
import Swal from "sweetalert2";
import apiClient from "../../../shared/api/apiClient"; // 💡 공통 인증 클라이언트 유지

export default function MetricDetailPage() {
  const { metricId } = useParams();
  const navigate = useNavigate();
  
  const { metrics, loading, requestApproval, refreshMetrics } = useEsgData();
  const [submitting, setSubmitting] = useState(false);

  const metric = metrics.find((m) => Number(m.id) === Number(metricId));

  // 반려 데이터 물리 파기 핸들러
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "데이터 삭제",
      text: "정말 이 반려된 데이터를 영구 삭제하시겠습니까?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: "#d14b43",
      cancelButtonColor: "#666"
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      // 💡 공통 주소 규격인 /metrics/{id} 타겟팅 완결
      await apiClient.delete(`/metrics/${id}`);
      
      await Swal.fire("완료", "데이터가 정상적으로 파기되었습니다.", "success");
      if (refreshMetrics) refreshMetrics();
      navigate("/manager/metrics"); 
    } catch (err) {
      console.error("데이터 삭제 실패:", err);
      Swal.fire("오류", "삭제 처리에 실패했습니다.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-10 text-center">데이터를 불러오는 중입니다...</p>;
  if (!metric) return <p className="p-10 text-center">데이터를 찾을 수 없습니다.</p>;

  // 승인 요청 및 수정 가능 상태 분기 조건 정의
  const canRequest = ["DRAFT", "REJECTED", "COLLECTED"].includes(metric.status);
  const canEdit = ["DRAFT", "REJECTED"].includes(metric.status);

  // 💡 [핵심 고도화] 기존 왼쪽 하단 버튼에서 호출하기 위한 공통 주소 및 분기 연산 미리 정의
  const hasFile = !!metric.evidence;
  const fileUrl = hasFile ? `http://localhost:8080${metric.evidence}` : "";
  const downloadApiUrl = hasFile ? `http://localhost:8080/api/files/download?fileUrl=${encodeURIComponent(metric.evidence)}` : "";
  const isOfficeFile = hasFile && ['.xlsx', '.xls', '.docx', '.hwp'].some(ext => metric.evidence.toLowerCase().endsWith(ext));

  // 💡 오피스 문서 및 PDF 계열에 따라 동적으로 알맞은 주소를 반환해주는 뷰어 링크 핸들러
  const handleFileViewClick = () => {
    if (!hasFile) return;
    if (isOfficeFile) {
      // 엑셀/워드: 빈 새 창 버그 없이 현재 창에서 안전하게 파일명 복원 다운로드 실행
      window.location.href = downloadApiUrl;
    } else {
      // PDF/이미지: 원래 스펙대로 새 창(blank)을 깔끔하게 열어 스트리밍 처리
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["ESG 데이터 관리", metric.title]}
        title={metric.title}
        description={`${metric.facility ?? "본사 공통"} · ${metric.period ?? ""}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>목록</Button>
            <StatusBadge status={metric.status} />
          </>
        }
      />
      <div className="detail-layout">
        
        {/* 왼쪽 섹션: 메인 실적 내용 패널 및 기존 디자인 버튼 활용 구역 */}
        <div className="main-content">
          <MetricDetailPanel metric={metric} />
          
          {/* 💡 [기존 디자인 복원] 원래 왼쪽 하단에 존재하던 '증빙 및 참고자료' 구역에 주소 기능 유기적 결합 */}
          <div className="evidence-section" style={{ marginTop: "25px", padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", margin: "0 0 12px 0", fontWeight: "bold" }}>| 증빙 및 참고자료</h3>
            {hasFile ? (
              <button 
                type="button" 
                className="btn-platform btn-platform-save" // 기존 플랫폼 버튼 스타일 클래스 유지
                style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "4px", fontWeight: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                onClick={handleFileViewClick}
              >
                📄 {isOfficeFile ? "증빙 자료 다운로드하기" : "첨부파일 확인하기"}
              </button>
            ) : (
              <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0" }}>첨부된 공식 증빙 서류 서류가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 오른쪽 섹션: 업무 처리 카드 대시보드 (임시 버튼 완전 삭제 완료) */}
        <aside>
          <div className="action-card">
            <h3>업무 처리</h3>
            <p>기업 ESG 관리자가 검토를 완료하면 시스템 총괄 관리자에게 최종 승인을 요청하거나 데이터를 보완할 수 있습니다.</p>
            
            <Button
              className="full"
              disabled={!canRequest || submitting}
              onClick={() => requestApproval(metric.id)}
            >
              승인 요청
            </Button>

            {canEdit && (
              <Button
                variant="outline"
                className="full"
                style={{ marginTop: "10px", borderColor: "#1f6b46", color: "#1f6b46" }}
                onClick={() => navigate(`/manager/metrics/${metric.id}/edit`)}
                disabled={submitting}
              >
                ✏️ 실적 내용 수정하기
              </Button>
            )}
            
            {metric.status === "PENDING" && <div className="readonly">현재 시스템 관리자 승인 대기 상태입니다.</div>}
            {metric.status === "APPROVED" && <div className="approved-note">승인 완료된 데이터 입니다.</div>}
            
            {metric.status === "REJECTED" && (
              <Button 
                variant="danger" 
                className="full" 
                style={{ marginTop: "10px" }} 
                onClick={() => handleDelete(metric.id)}
                disabled={submitting}
              >
                데이터 영구 삭제
              </Button>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
