import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import { metricApi } from "../../metric/api/metricApi";

const createReportDraft = (approvedMetrics, year, scope) => {
  const environmentCount = approvedMetrics.filter((metric) => metric.category === "ENVIRONMENT").length;
  const socialCount = approvedMetrics.filter((metric) => metric.category === "SOCIAL").length;
  const governanceCount = approvedMetrics.filter((metric) => metric.category === "GOVERNANCE").length;

  return [
    `${year}년 ${scope} ESG 운영 보고서는 최종 승인된 지표 ${approvedMetrics.length}건을 기준으로 작성되었습니다.`,
    `환경 ${environmentCount}건, 사회 ${socialCount}건, 거버넌스 ${governanceCount}건의 확정 실적을 포함합니다.`,
    "환경·사회 사업장 실적과 기업 단위 거버넌스 지표를 함께 검토하여 최종 보고 문구를 확정했습니다.",
  ].join("\n\n");
};

export default function ReportBuilderPage() {
  const [year, setYear] = useState("2026");
  const [approvedRows, setApprovedRows] = useState([]);
  const [scope, setScope] = useState("전체 사업장");
  const [draft, setDraft] = useState("");

  const approvedMetrics = useMemo(
    () => approvedRows.filter((metric) => scope === "전체 사업장" || metric.facility === scope),
    [approvedRows, scope],
  );

  useEffect(() => {
    let active = true;
    metricApi.list({ year: Number(year), status: "APPROVED" })
      .then((data) => {
        if (!active) return;
        const rows = data || [];
        setApprovedRows(rows);
        setDraft(createReportDraft(rows, year, "전체 사업장"));
      })
      .catch((error) => console.error("[REPORT] 승인 데이터 조회 실패", error));
    return () => { active = false; };
  }, [year]);

  const generateDraft = () => {
    setDraft(createReportDraft(approvedMetrics, year, scope));
  };

  return (
    <div className="page-stack report-page">
      <PageHeader
        breadcrumbs={["성과·보고", "리포트 빌더"]}
        eyebrow="APPROVED DATA REPORTING"
        title="ESG 보고서 작성"
        description="최종 승인된 ESG 실적만 불러와 보고서 요약문을 작성하고 PDF로 저장합니다."
        actions={(
          <>
            <Button variant="outline" onClick={generateDraft}>확정 데이터 초안 생성</Button>
            <Button onClick={() => window.print()}>PDF 저장</Button>
          </>
        )}
      />

      <div className="report-builder">
        <Card title="보고서 설정" description="공식 보고서는 최종 승인된 값만 사용합니다.">
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
              <option value="서울 본사">서울 본사</option>
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
            <span>최종 승인 데이터</span>
            <strong>{approvedMetrics.length}건</strong>
          </div>
        </Card>

        <Card title="보고서 요약문 편집" className="report-editor-card">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
          <div className="card-actions"><Button onClick={() => window.print()}>최종 내용 확정</Button></div>
        </Card>
      </div>

      <article className="print-sheet">
        <span>{year} SUSTAINABILITY REPORT</span>
        <h1>에코모빌리티 파츠 ESG 보고서</h1>
        <h2>Executive Summary</h2>
        {draft.split("\n").filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}
      </article>
    </div>
  );
}
