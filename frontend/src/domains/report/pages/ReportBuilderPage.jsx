import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./ReportBuilderPage.css";
import { useSearchParams } from "react-router-dom";
import { reportApi } from "../api/reportApi";
import { performanceApi } from "../../metric/api/performanceApi";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import { useReportBuilder } from "../hooks/useReportBuilder";
import { useSlashMenu } from "../hooks/useSlashMenu";
import { useReportHistory } from "../hooks/useReportHistory";
import { downloadPdf, downloadWord } from "../utils/reportExportUtils";
import ReportSettingsModal from "../components/ReportSettingsModal";
import ReportFAB from "../components/ReportFAB";

const VALID_YEARS = [2026, 2025, 2024];

const formatValue = (metric) => {
  if (metric?.value === null || metric?.value === undefined) return "-";
  return `${Number(metric.value).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${metric.unit || ""}`.trim();
};

const latestApprovedMonth = (metrics) => metrics.reduce((latest, metric) => {
  const month = Number(String(metric.period || "").slice(5, 7));
  return Number.isFinite(month) ? Math.max(latest, month) : latest;
}, 0);

const buildApprovedPerformanceHtml = (metrics, year, scope) => {
  const byCategory = {
    ENVIRONMENT: metrics.filter((metric) => metric.category === "ENVIRONMENT"),
    SOCIAL: metrics.filter((metric) => metric.category === "SOCIAL"),
    GOVERNANCE: metrics.filter((metric) => metric.category === "GOVERNANCE"),
  };
  const month = latestApprovedMonth(metrics);
  const periodLabel = month > 0 ? `${year}년 1~${month}월 승인 완료 실적` : `${year}년 승인 완료 실적`;

  const section = (title, rows) => {
    if (!rows.length) return `<h2>${title}</h2><p>승인 완료된 실적이 없습니다.</p>`;
    return `<h2>${title}</h2><table><thead><tr><th>지표</th><th>최신 승인기간</th><th>확정 실적</th></tr></thead><tbody>${rows
      .map((row) => `<tr><td>${row.title}</td><td>${row.period || "-"}</td><td>${formatValue(row)}</td></tr>`)
      .join("")}</tbody></table>`;
  };

  return [
    `<h1>${year}년 ESG 확정 실적 보고서</h1>`,
    `<p><strong>보고 범위:</strong> ${scope}</p>`,
    `<p><strong>적용 기준:</strong> ${periodLabel}</p>`,
    "<blockquote>본 보고서의 수치는 기업 ESG 관리자가 등록하고 시스템 총괄 관리자가 최종 승인한 APPROVED 데이터만을 기준으로 작성되었습니다.</blockquote>",
    section("환경(Environment)", byCategory.ENVIRONMENT),
    section("사회(Social)", byCategory.SOCIAL),
    section("거버넌스(Governance)", byCategory.GOVERNANCE),
  ].join("");
};

export default function ReportBuilderPage() {
  const [searchParams] = useSearchParams();
  const requestedYear = Number(searchParams.get("year"));
  const initialYear = VALID_YEARS.includes(requestedYear) ? String(requestedYear) : "2026";
  const previewRef = useRef(null);
  const quillRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvedMetrics, setApprovedMetrics] = useState([]);
  const [isApprovedLoading, setIsApprovedLoading] = useState(false);
  const [approvedError, setApprovedError] = useState("");

  const builderState = useReportBuilder(initialYear);
  const { slashMenu, insertSlashCommand } = useSlashMenu(quillRef, builderState.setContent);
  const historyState = useReportHistory();

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  }), []);

  useEffect(() => {
    let active = true;
    const loadApprovedMetrics = async () => {
      setIsApprovedLoading(true);
      setApprovedError("");
      try {
        const response = await performanceApi.getPerformanceMetrics(Number(builderState.year));
        if (!active) return;
        const rows = response.data?.data || response.data || [];
        setApprovedMetrics(rows.filter((row) => row.status === "APPROVED"));
      } catch (error) {
        if (!active) return;
        console.error("리포트용 승인 실적 조회 실패", error);
        setApprovedMetrics([]);
        setApprovedError("승인 완료 실적을 불러오지 못했습니다.");
      } finally {
        if (active) setIsApprovedLoading(false);
      }
    };

    void loadApprovedMetrics();
    return () => {
      active = false;
    };
  }, [builderState.year]);

  const approvedMonth = useMemo(() => latestApprovedMonth(approvedMetrics), [approvedMetrics]);
  const approvedPeriodLabel = approvedMonth > 0
    ? `${builderState.year}년 1~${approvedMonth}월 승인완료`
    : `${builderState.year}년 승인완료 데이터 없음`;

  const handleImportApprovedMetrics = () => {
    if (!approvedMetrics.length) {
      window.alert(`${builderState.year}년에 리포트로 불러올 승인 완료 실적이 없습니다.`);
      return;
    }
    if (builderState.content && !window.confirm("현재 편집 중인 본문을 승인 실적 기반 초안으로 교체하시겠습니까?")) return;
    builderState.setContent(buildApprovedPerformanceHtml(approvedMetrics, builderState.year, builderState.scope));
    builderState.setTitle(`${builderState.year}년 에코모빌리티 파츠 ESG 보고서`);
  };

  const handleEditLoad = (row) => {
    builderState.setTitle(row.title);
    builderState.setYear(String(row.targetYear));
    builderState.setScope(row.scope);
    builderState.setContent(row.content);
    builderState.setSelectedTemplateId(String(row.templateId));
    historyState.setViewMode("WRITE");
  };

  const handleCreateNew = () => {
    if (!window.confirm("현재 에디터의 내용이 초기화됩니다. 새 보고서를 작성하시겠습니까?")) return;
    builderState.setTitle("새 ESG 보고서");
    builderState.setYear(initialYear);
    builderState.setScope("전체 사업장");
    builderState.setContent("");
    if (builderState.templates?.length) {
      builderState.setSelectedTemplateId(String(builderState.templates[0].id));
    }
    historyState.setViewMode("WRITE");
  };

  const handleSaveReport = async () => {
    const templateId = Number(builderState.selectedTemplateId);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      window.alert("보고서 템플릿을 먼저 선택해 주세요.");
      return;
    }
    if (!window.confirm("작성하신 보고서의 최종 내용을 서버에 공시 저장하시겠습니까?")) return;

    builderState.setIsSaving(true);
    try {
      await reportApi.generate({
        templateId,
        title: builderState.title,
        content: builderState.content,
        targetYear: Number(builderState.year),
        scope: builderState.scope,
        version: "v1.0",
        fileUrl: "",
        isPublic: false,
      });
      localStorage.removeItem("esg_report_draft");
      window.alert("보고서가 서버에 성공적으로 저장되었습니다.");
      historyState.handleViewModeChange("HISTORY");
    } catch (error) {
      console.error("보고서 저장 실패", error);
      window.alert("보고서 저장에 실패했습니다. 관리자에게 문의하세요.");
    } finally {
      builderState.setIsSaving(false);
    }
  };

  return (
    <div className="page-stack report-page" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 120px)" }}>
      <PageHeader
        breadcrumbs={["성과·보고", "리포트 빌더"]}
        eyebrow="APPROVED DATA REPORTING"
        title={<span style={{ whiteSpace: "nowrap" }}>ESG 보고서 시스템</span>}
        description="ESG 실적 조회의 최종 승인 데이터를 불러와 보고서를 편집·저장·출력합니다."
        actions={(
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {historyState.viewMode === "WRITE" && (
              <>
                <span style={{ fontSize: "12px", color: approvedError ? "#dc2626" : "#64748b", whiteSpace: "nowrap" }}>
                  {isApprovedLoading ? "승인 실적 조회 중..." : approvedError || `${approvedPeriodLabel} · ${approvedMetrics.length}개 지표`}
                </span>
                <Button variant="outline" onClick={handleImportApprovedMetrics} disabled={isApprovedLoading || !approvedMetrics.length}>
                  확정 실적 불러오기
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>기본 설정</Button>
                <Button variant="outline" onClick={() => downloadWord(previewRef, builderState.year, builderState.title)}>Word 출력</Button>
                <Button variant="outline" onClick={() => downloadPdf(previewRef, builderState.year, builderState.title)}>PDF 출력</Button>
                <Button onClick={handleSaveReport} disabled={builderState.isSaving}>
                  {builderState.isSaving ? "저장 중..." : "최종 내용 저장"}
                </Button>
              </>
            )}
          </div>
        )}
      />

      {historyState.viewMode === "WRITE" && (
        <div style={{ display: "flex", gap: "24px", flex: 1, marginTop: "16px", minHeight: 0, flexWrap: "wrap" }}>
          <div className="equal-height-card-wrapper" style={{ flex: "1 1 480px", minWidth: 0 }}>
            <Card title="실시간 미리보기" description={`${approvedPeriodLabel} 기준`}>
              <div className="report-builder-scroll preview-editor" ref={previewRef} style={{ flex: 1, overflowY: "auto", padding: "10px", boxSizing: "border-box" }}>
                <span style={{ color: "#166534", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px" }}>{builderState.year} SUSTAINABILITY REPORT</span>
                <h1 style={{ borderBottom: "3px solid #166534", paddingBottom: "15px", marginTop: "12px", marginBottom: "24px", fontSize: "28px", color: "#0f172a", wordBreak: "keep-all" }}>
                  {builderState.title || "보고서 제목을 입력해 주세요"}
                </h1>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px", borderBottom: "2px solid #cbd5e1", paddingBottom: "8px" }}>
                  <span>● 보고 연도: {builderState.year}년</span> | <span>● 보고 범위: {builderState.scope}</span>
                </div>
                <div className="readonly-editor">
                  <ReactQuill theme="snow" value={builderState.content} readOnly modules={{ toolbar: false }} />
                </div>
              </div>
            </Card>
          </div>

          <div className="equal-height-card-wrapper" style={{ flex: "1 1 480px", position: "relative", minWidth: 0 }}>
            <Card title="본문 편집" description="불러온 확정 실적을 바탕으로 설명 문구와 표를 편집합니다.">
              <div className="no-border-editor" style={{ flex: 1, paddingBottom: "10px", position: "relative" }}>
                {slashMenu.visible && (
                  <div className="slash-menu" style={{ top: slashMenu.top, left: slashMenu.left }}>
                    <div style={{ padding: "4px 16px", fontSize: "12px", color: "#94a3b8", fontWeight: "bold" }}>블록 삽입</div>
                    <button type="button" className="slash-menu-item" onClick={() => insertSlashCommand("table")}>📊 2x2 데이터 표</button>
                    <button type="button" className="slash-menu-item" onClick={() => insertSlashCommand("quote")}>💡 강조 요약문</button>
                    <button type="button" className="slash-menu-item" onClick={() => insertSlashCommand("sign")}>✍️ 임원 결재 서명란</button>
                  </div>
                )}
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={builderState.content}
                  onChange={(value, _delta, source) => {
                    if (source === "user") builderState.setContent(value);
                  }}
                  modules={modules}
                  style={{ height: "100%" }}
                  placeholder="내용을 작성하거나 '/'를 눌러 도구를 호출하세요."
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {historyState.viewMode === "HISTORY" && (
        <div style={{ marginTop: "20px", flex: 1, overflowY: "auto" }}>
          <Card title="발간 보고서 이력" description="서버에 저장된 리포트 목록과 공개 상태를 관리합니다.">
            {historyState.isHistoryLoading ? (
              <div className="page-loading">보고서 이력을 불러오는 중입니다.</div>
            ) : (
              <DataTable
                rows={historyState.historyRows}
                columns={[
                  { key: "targetYear", label: "보고연도", render: (value) => `${value}년` },
                  { key: "title", label: "보고서 제목", render: (value) => <strong>{value}</strong> },
                  { key: "scope", label: "보고 범위" },
                  { key: "version", label: "공시 버전" },
                  { key: "createdAt", label: "생성 일시", render: (value) => new Date(value).toLocaleString("ko-KR") },
                  { key: "isPublic", label: "공개 상태", render: (value, row) => <Button variant={value ? "primary" : "outline"} size="small" onClick={() => historyState.handleTogglePublic(row.id, value)}>{value ? "공개" : "비공개"}</Button> },
                  { key: "actions", label: "관리", render: (_, row) => <div style={{ display: "flex", gap: "6px" }}><Button variant="outline" size="small" onClick={() => handleEditLoad(row)}>수정</Button><Button variant="danger" size="small" onClick={() => historyState.handlePermanentDelete(row.id)}>삭제</Button></div> },
                ]}
                emptyText="저장된 보고서가 없습니다."
              />
            )}
          </Card>
        </div>
      )}

      <ReportSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} builderState={builderState} />
      <ReportFAB viewMode={historyState.viewMode} setViewMode={historyState.handleViewModeChange} onCreateNew={handleCreateNew} />
    </div>
  );
}
