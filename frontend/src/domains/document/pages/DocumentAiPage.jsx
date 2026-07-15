import { useState } from "react";
import axios from "axios"; // 💡 실제 API 통신을 위해 axios 임포트 추가
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import Icon from "../../../shared/components/Icon";

export default function DocumentAiPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); // 💡 AI 분석 중 로딩 상태 제어용 추가

  /**
   * 💡 [변경] 1단계: 파일을 공통 업로드 API에 올린 후, 
   * 반환된 fileUrl을 가지고 진짜 AI 분석 헬퍼 API를 호출합니다.
   */
  const analyze = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1.1 공통 파일 업로드 API 호출 (/api/files/upload)
      const uploadResponse = await axios.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const uploadedFileUrl = uploadResponse.data.fileUrl;

      // 1.2 업로드된 파일 경로를 백엔드 OpenAI 헬퍼 API로 전송 (/api/document-analysis/helper)
      const aiResponse = await axios.post(`/api/document-analysis/helper?fileUrl=${encodeURIComponent(uploadedFileUrl)}`);
      
      // 1.3 백엔드가 반환한 진짜 AI 분석 결과(DTO)를 state에 안착
      setResult(aiResponse.data);
    } catch (error) {
      console.error("AI 분석 중 장애 발생:", error);
      Swal.fire("분석 실패", "문서 분석 중 서버 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 💡 [변경] 2단계: 사용자가 AI 결과를 최종 검토(수정)한 후, 
   * 결재선에 상신하거나 임시저장할 수 있는 제출 API를 호출합니다.
   */
  const apply = async () => {
    if (!result) return;

    try {
      // 사용자가 화면에서 점검을 마쳤으므로 기존 결재 라인 양식에 맞춰 전송 데이터 조립
      // submitForApproval: true -> 즉시 결재 상신(PENDING), false -> 임시저장(DRAFT)
      const approvalPayload = {
        indicatorId: result.indicatorId,
        facilityId: result.facilityId,
        reportingYear: result.reportingYear,
        periodType: result.periodType,
        periodValue: result.periodValue,
        rate: result.rate,               // 최종 수치값
        agenda: result.agenda,           // 안건 제목
        aiExplanation: result.aiExplanation, // 💡 사용자가 수정한 최종 AI 요약 텍스트 리포트
        fileUrl: result.fileUrl,         // 증빙 파일 URL 경로
        submitForApproval: true          // 💡 결재 신청 버튼이므로 즉시 상신 처리
      };

      // 백엔드 최종 결재 통합 처리 API 호출 (/api/document-analysis/submit)
      await axios.post("/api/document-analysis/submit", approvalPayload);

      Swal.fire({
        icon: "success",
        title: "ESG 결재 신청 완료",
        text: "AI 추출 및 검토 값이 정상적으로 결재 상신 프로세스에 등록되었습니다.",
        confirmButtonColor: "#1f6b46"
      });
    } catch (error) {
      console.error("결재 신청 중 장애 발생:", error);
      Swal.fire("신청 실패", "결재선 상신 중 서버 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div className="page-stack">
      <PageHeader 
        breadcrumbs={["데이터 관리", "문서·AI 분석"]} 
        title="증빙문서 등록·AI 분석" 
        description="PDF·Excel 문서에서 ESG 핵심 항목을 추출하고 시스템 등록값과 비교합니다." 
      />
      <div className="two-cols">
        <Card title="문서 Upload">
          <label className="upload-zone">
            <input 
              type="file" 
              accept=".pdf,.xlsx,.xls" 
              onChange={e => setFile(e.target.files?.[0])} 
              disabled={loading}
            />
            <Icon name="upload" size={30} />
            <strong>{file?.name || "파일을 선택하거나 이곳에 드래그하세요."}</strong>
            <span>이사회 회의록, 안전보고서, 전력 고지서</span>
          </label>
          <Button className="full" disabled={!file || loading} onClick={analyze}>
            <Icon name="ai" size={17} /> {loading ? "AI 분석 진행 중..." : "AI 분석 실행"}
          </Button>
        </Card>
        
        <Card title="분석 상태">
          {!result ? (
            <div className="empty-state">
              <strong>{loading ? "AI 정밀 OCR 분석 중" : "분석 대기"}</strong>
              <p>{loading ? "OpenAI가 비정형 리포트를 읽어 해석 문장을 작성하고 있습니다." : "문서를 등록하면 추출 결과가 표시됩니다."}</p>
            </div>
          ) : (
            <div className="analysis-status">
              <article><span>문서 유형</span><strong>{result.type}</strong></article>
              <article><span>신뢰도</span><strong>{result.confidence}%</strong></article>
              <article><span>상태</span><strong className="success-text">분석 완료</strong></article>
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card title="AI 추출 결과 (최종 검토)">
          {/* 💡 사용자가 AI 풀어쓰기 설명문을 직접 보고 편집할 수 있도록 UI에 연결 */}
          <div style={{ marginBottom: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "8px" }}>
            <span style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "8px" }}>📝 AI 생성 요약 해설 (수정 가능)</span>
            <textarea 
              style={{ width: "100%", minHeight: "100px", border: "1px solid #ddd", borderRadius: "6px", padding: "10px", fontSize: "14px", lineHeight: "1.5" }}
              value={result.aiExplanation}
              onChange={e => setResult({ ...result, aiExplanation: e.target.value })}
            />
          </div>

          <div className="detail-grid three">
            {[
              ["회의일", result.date],
              ["전체 이사", `${result.total}명`],
              ["참석 이사", `${result.attended}명`],
              ["참석률", `${result.rate}%`],
              ["ESG 안건", result.agenda],
              ["검증 결과", "반영 가능"]
            ].map(([l, v]) => (
              <div key={l}>
                <span>{l}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          
          <div className="card-actions">
            <Button onClick={apply}>ESG 데이터 결재 신청</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
