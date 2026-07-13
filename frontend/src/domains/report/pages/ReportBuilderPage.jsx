import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import apiClient from "../../../shared/api/apiClient";
import { metricApi } from "../../metric/api/metricApi";
import { useRealtime } from "../../../app/providers/RealtimeProvider";

const createRuleBasedDraft = (approvedMetrics, year, scope) => {
  const environmentCount = approvedMetrics.filter((metric) => metric.category === "ENVIRONMENT").length;
  const socialCount = approvedMetrics.filter((metric) => metric.category === "SOCIAL").length;
  const governanceCount = approvedMetrics.filter((metric) => metric.category === "GOVERNANCE").length;

  return [
    `${year}년 ${scope} ESG 운영 보고서는 승인 완료된 지표 ${approvedMetrics.length}건을 기준으로 작성되었습니다.`,
    `환경 ${environmentCount}건, 사회 ${socialCount}건, 거버넌스 ${governanceCount}건의 공식 실적을 포함합니다.`,
    "사업장별 환경·사회 실적과 본사 단위 거버넌스 현황을 함께 검토한 뒤 최종 공시 문구를 확정해야 합니다.",
  ].join("\n\n");
};

export default function ReportBuilderPage() {
  const { eventFor } = useRealtime();
  const reportEvent = eventFor("report");
  const [year, setYear] = useState("2026");
  const [approvedRows, setApprovedRows] = useState([]);
  const [scope, setScope] = useState("전체 사업장");
  const approvedMetrics = useMemo(() => approvedRows.filter((metric) => scope === "전체 사업장" || metric.facility === scope), [approvedRows, scope]);
  const [draft, setDraft] = useState("");
  const [aiJobId, setAiJobId] = useState(null);

  useEffect(() => {
    let active = true;
    metricApi.list({ year: Number(year), status: "APPROVED" })
      .then((data) => {
        if (!active) return;
        const rows = data || [];
        setApprovedRows(rows);
        setDraft(createRuleBasedDraft(rows, year, "전체 사업장"));
      })
      .catch((error) => console.error("[REPORT] 승인 데이터 조회 실패", error));
    return () => { active = false; };
  }, [year]);

  const refreshRuleBasedDraft = () => {
    setDraft(createRuleBasedDraft(approvedMetrics, year, scope));
  };

  const requestAiPolish = async () => {
    const prompt = [
      `보고 연도: ${year}`,
      `보고 범위: ${scope}`,
      `승인 완료 지표 수: ${approvedMetrics.length}`,
      "아래 초안을 경영진용 ESG 보고서 요약문으로 간결하게 다듬어 주세요.",
      draft,
    ].join("\n");

    try {
      const response = await apiClient.post("/manager/ai/analyze", {
        domain: "report",
        prompt,
      });
      setAiJobId(response.data?.data?.jobId || null);
    } catch (error) {
      console.error("[REPORT_AI] AI 보고서 초안 요청 실패", error);
    }
  };

  const activeAiEvent = reportEvent?.jobId === aiJobId ? reportEvent : null;
  const aiProcessing = Boolean(aiJobId) && !["COMPLETED", "FAILED"].includes(activeAiEvent?.status);
  const displayedDraft = activeAiEvent?.type === "AI_ANALYSIS_COMPLETED" && activeAiEvent.result
    ? activeAiEvent.result
    : draft;

  return (
    <div className="page-stack report-page">
      <PageHeader
        breadcrumbs={["성과·보고", "리포트 빌더"]}
        eyebrow="APPROVED DATA REPORTING"
        title="ESG 보고서 작성"
        description="승인 완료 데이터를 기준으로 보고서 초안을 만들고, 필요할 때만 Gemini로 문장을 보완합니다."
        actions={(
          <>
            <Button variant="outline" onClick={refreshRuleBasedDraft}>기본 초안 생성</Button>
            <Button variant="outline" disabled={aiProcessing} onClick={requestAiPolish}>
              {aiProcessing ? "AI 보완 중" : "AI 문장 보완"}
            </Button>
            <Button onClick={() => window.print()}>PDF 저장</Button>
          </>
        )}
      />

      <div className="report-builder">
        <Card title="보고서 설정" description="공식 보고서는 승인 완료된 값만 사용합니다.">
          <label className="field">
            <span>보고 연도</span>
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </label>
          <label className="field">
            <span>보고 범위</span>
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="전체 사업장">전체 사업장</option>
              <option value="부산공장">부산공장</option>
              <option value="울산공장">울산공장</option>
            </select>
          </label>
          <div className="check-list">
            <label><input type="checkbox" defaultChecked /> 환경(E)</label>
            <label><input type="checkbox" defaultChecked /> 사회(S)</label>
            <label><input type="checkbox" defaultChecked /> 거버넌스(G)</label>
          </div>
          <div className="report-count">
            <span>승인 데이터</span>
            <strong>{approvedMetrics.length}건</strong>
          </div>
        </Card>

        <Card title="보고서 요약문 편집" className="report-editor-card">
          <textarea
            value={displayedDraft}
            onChange={(event) => {
              setDraft(event.target.value);
              setAiJobId(null);
            }}
          />
          {activeAiEvent && (
            <p className={`operation-message ${activeAiEvent.status?.toLowerCase() || "processing"}`}>
              {activeAiEvent.message}
            </p>
          )}
          <div className="card-actions">
            <Button>최종 내용 확정</Button>
          </div>
        </Card>
      </div>

      <article className="print-sheet">
        <span>{year} SUSTAINABILITY REPORT</span>
        <h1>에코모빌리티 파츠 ESG 보고서</h1>
        <h2>Executive Summary</h2>
        {displayedDraft.split("\n").filter(Boolean).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </div>
  );
}
