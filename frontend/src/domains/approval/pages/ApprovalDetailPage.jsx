import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import { metricApi } from "../../metric/api/metricApi"; // 💡 기존 메트릭 상세조회 API 호환 재사용
import Swal from "sweetalert2";
import apiClient from "../../../shared/api/apiClient";

export default function ApprovalDetailPage() {
  const { metricId } = useParams();
  const navigate = useNavigate();
  
  const [metric, setMetric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 반려 처리 시 팝업창에서 받아올 결재 의견(반려 사유) 상태값
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await metricApi.detail(metricId);
        setMetric(response.data);
      } catch (err) {
        console.error("결재 상세 데이터 로드 실패:", err);
        Swal.fire("오류", "결재 대상 데이터를 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [metricId]);

  // 💡 [결재 처리 핵심 공통 함수]: 백엔드의 PATCH /api/esg/metrics/{id}/decide 명세 호출
  const handleDecision = async (statusType, reasonComment = "") => {
    setSubmitting(true);
    try {
      // 💡 apiClient를 이용해 인증토큰을 자동으로 싣고 쿼리 파라미터 방식으로 전송 완료
      await apiClient.patch(`/esg/metrics/${metricId}/decide?decision=${statusType}&comment=${encodeURIComponent(reasonComment)}`);
      
      await Swal.fire({
        title: statusType === "APPROVED" ? "최종 승인 완료" : "결재 반려 완료",
        text: statusType === "APPROVED" ? "해당 ESG 실적이 최종 승인 확정되었습니다." : "반려 처리가 정상 완료되었습니다.",
        icon: "success",
        confirmButtonColor: "#1f6b46"
      });
      
      navigate("/admin/approvals"); // 결재 처리 후 관리자 대기 목록으로 안전하게 리다이렉트
    } catch (err) {
      console.error("결재 결정 전송 실패:", err);
      Swal.fire("오류", "결재 처리에 실패했습니다. 입력 사유 또는 권한을 확인하세요.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // 반려 버튼 클릭 시 사유를 필수로 입력받는 SweetAlert2 팝업 결합 핸들러
  const handleRejectClick = async () => {
    const { value: textReason } = await Swal.fire({
      title: "결재 반려 처리",
      input: "textarea",
      inputLabel: "반려 사유 입력 *",
      inputPlaceholder: "작성자가 수정할 수 있도록 구체적인 반려 사유를 기입해 주세요...",
      inputAttributes: { "aria-label": "반려 사유를 기입하세요" },
      showCancelButton: true,
      confirmButtonText: "반려 확정",
      cancelButtonText: "취소",
      confirmButtonColor: "#d14b43",
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("반려 시 사유를 반드시 입력해야 합니다!");
        }
        return value;
      }
    });

    if (textReason) {
      handleDecision("REJECTED", textReason);
    }
  };

  if (loading) return <p className="p-10 text-center">결재 정보를 불러오는 중입니다...</p>;
  if (!metric) return <p className="p-10 text-center">결재 데이터를 찾을 수 없습니다.</p>;

  // 현재 데이터 상태에 따른 최종 결재 버튼 활성화 가능 조건 정의
  const isPending = metric.status === "PENDING";

  // 💡 [전역 첨부파일 인프라 매핑 결합]
  const hasFile = !!metric.evidence;
  const fileUrl = hasFile ? `http://localhost:8080${metric.evidence}` : "";
  const downloadApiUrl = hasFile ? `http://localhost:8080/api/files/download?fileUrl=${encodeURIComponent(metric.evidence)}` : "";
  const isOfficeFile = hasFile && ['.xlsx', '.xls', '.docx', '.hwp'].some(ext => metric.evidence.toLowerCase().endsWith(ext));

  // 💡 작성자 상세 창과 100% 동일하게 일관성을 맞춘 크롬 새 탭 전용 뷰어 핸들러 함수
  const handleFileViewClick = () => {
    if (!hasFile) return;
    if (isOfficeFile) {
      // 엑셀/워드: 빈 새 창 버그 없이 현재 창에서 안전하게 파일명 복원 다운로드 실행
      window.location.href = downloadApiUrl;
    } else {
      // PDF/이미지: 작성 창과 완전히 일치하도록 크롬 상단 새 탭(_blank)으로 깔끔하게 열기
      window.open(fileUrl, "_blank");
    }
  };
return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["시스템 관리", "결재 및 승인 관리", "상세 심사"]}
        title="ESG 데이터 최종 결재 심사"
        description="제출 기관 실적 및 공식 서류 검토를 바탕으로 승인 또는 반려 결정을 내립니다."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>결재목록</Button>
            <StatusBadge status={metric.status} />
          </>
        }
      />

      <div className="detail-layout">
        
        {/* 왼쪽 메인 패널 섹션 */}
        <div className="main-content">
          <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", borderBottom: "2px solid #1f6b46", paddingBottom: "8px" }}>📊 제출 실적 데이터 요약</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px", fontSize: "15px" }}>
              <div><strong>지표명:</strong> {metric.title} (<code>{metric.indicatorCode}</code>)</div>
              <div><strong>카테고리:</strong> {metric.category} / {metric.subCategory}</div>
              <div><strong>보고 주기:</strong> {metric.year}년 / {metric.period}</div>
              
              {/* 💡 [추가 완치 1] 어느 공장의 실적인지 심사할 수 있도록 사업장 정보 노출 */}
              <div><strong>제출 사업장:</strong> <span style={{ color: "#1f6b46", fontWeight: "bold" }}>{metric.facility || "본사 공통"}</span></div>
              
              <div style={{ gridColumn: "span 2" }}><strong>제출자 ID명:</strong> {metric.assignee || "기업 관리자"}</div>
            </div>
            
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748b" }}>정량 측정 데이터 값</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1f6b46", marginTop: "5px" }}>
                {metric.value !== null && metric.value !== undefined ? Number(metric.value).toLocaleString() : "-"} <span style={{ fontSize: "16px", color: "#334155" }}>{metric.unit}</span>
              </div>
            </div>

            {/* 💡 [추가 완치 2] 작성자가 입력한 정성 내용 및 비고 기술 서류를 본문 영역에 상시 노출 */}
            <div style={{ marginBottom: "20px", marginTop: "20px" }}>
              <strong style={{ fontSize: "15px", display: "block", marginBottom: "6px" }}>✏️ 작성자 보고 내용 (정성적 설명 / 비고)</strong>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "6px", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6", color: "#334155", minHeight: "80px" }}>
                {metric.textValue || metric.text_value ? (metric.textValue || metric.text_value) : <span style={{ color: "#94a3b8", italic: "true" }}>제출된 작성자 설명 내용이 없습니다.</span>}
              </div>
            </div>

            {/* 증빙 및 참고자료 구역 */}
            <div className="evidence-section" style={{ marginTop: "25px", borderTop: "1px dashed #cbd5e1", paddingTop: "20px" }}>
              <h3 style={{ fontSize: "16px", margin: "0 0 12px 0", fontWeight: "bold" }}>| 증빙 및 참고자료 심사</h3>
              {hasFile ? (
                <button 
                  type="button" 
                  className="btn-platform btn-platform-save" 
                  style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "4px", fontWeight: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={handleFileViewClick}
                >
                  📄 {isOfficeFile ? "증빙 자료 다운로드하기" : "첨부파일 확인하기"}
                </button>
              ) : (
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0" }}>제출자가 첨부한 공식 증빙 서류가 존재하지 않습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽 섹션: 관리자 결재 처리 조작 대시보드 */}
        <aside>
          <div className="action-card" style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 10px 0" }}>결재 의사결정</h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "20px" }}>
              제출된 데이터 수치와 공식 증빙 서류 내역의 위변조 여부를 꼼꼼히 심사한 뒤, 최종 승인 확정 또는 반려 처리를 결정합니다.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Button
                className="full"
                disabled={!isPending || submitting}
                onClick={() => handleDecision("APPROVED", "최종 검토 승인 완료")}
                style={{ background: "#1f6b46", color: "#fff" }}
              >
                ✓ 최종 결재 승인
              </Button>

              <Button
                variant="outline"
                className="full"
                disabled={!isPending || submitting}
                onClick={handleRejectClick}
                style={{ borderColor: "#d14b43", color: "#d14b43" }}
              >
                ✕ 서류 반려 처리
              </Button>
            </div>

            {metric.status === "APPROVED" && (
              <div style={{ marginTop: "15px", padding: "10px", background: "#e1f5e9", color: "#1f6b46", borderRadius: "4px", textAlign: "center", fontSize: "13px", fontWeight: "bold" }}>
                🎉 본 지표 실적은 최종 승인이 완료되어 플랫폼에 공정 공시되었습니다.
              </div>
            )}
            
            {metric.status === "REJECTED" && (
              <div style={{ marginTop: "15px", padding: "10px", background: "#fde8e8", color: "#e53e3e", borderRadius: "4px", fontSize: "13px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>🚫 결재 반려된 실적입니다.</div>
                {metric.aiFinding && <div style={{ fontSize: "12px", color: "#4a5568" }}><strong>반려 사유:</strong> {metric.aiFinding}</div>}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}