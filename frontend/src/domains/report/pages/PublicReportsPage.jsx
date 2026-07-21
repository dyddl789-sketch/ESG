// 파일 위치: src/domains/report/pages/ReportBuilderPage.js
// 버전: v1.10.0
// 기능 요약: 기본 설정과 실적 불러오기를 하나의 모달 플로우로 통합하고, '월별 조회' 및 '누적 조회' 로직을 지원합니다.

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
import { useMetricPeriods } from "../../metric/hooks/useMetricPeriods";
import { useSlashMenu } from "../hooks/useSlashMenu";
import { useReportHistory } from "../hooks/useReportHistory";
import { downloadPdf, downloadWord } from "../utils/reportExportUtils";
import ReportSettingsModal from "../components/ReportSettingsModal";
import ReportFAB from "../components/ReportFAB";

const formatValue = (metric) => {
  if (metric?.value === null || metric?.value === undefined) return "-";
  return `${Number(metric.value).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${metric.unit || ""}`.trim();
};

const getFacilityName = (metric) => {
  return metric.facilityName || metric.additionalInfo?.facilityName || metric.additional_info?.facilityName || "전사 공통";
};

const buildApprovedPerformanceHtml = (aggregatedRows, year, scope, month) => {
  const byCategory = {
    ENVIRONMENT: aggregatedRows.filter((row) => row.category === "ENVIRONMENT"),
    SOCIAL: aggregatedRows.filter((row) => row.category === "SOCIAL"),
    GOVERNANCE: aggregatedRows.filter((row) => row.category === "GOVERNANCE"),
  };

  const periodLabel = month === "ALL" ? `${year}년 누적(평균) 실적` : `${year}년 ${month}월 기준 실적`;

  const section = (title, rows) => {
    if (!rows.length) return `<h2>${title}</h2><p>해당 기간에 승인 완료된 실적이 없습니다.</p>`;
    return `<h2>${title}</h2><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" border="1">
      <thead>
        <tr>
          <th style="padding: 8px; background-color: #f8fafc;">사업장</th>
          <th style="padding: 8px; background-color: #f8fafc;">지표</th>
          <th style="padding: 8px; background-color: #f8fafc;">확정 기준</th>
          <th style="padding: 8px; background-color: #f8fafc;">집계 실적</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td style="padding: 8px; text-align: center;">${row.facilityName}</td>
            <td style="padding: 8px;">${row.title || row.indicatorCode}</td>
            <td style="padding: 8px; text-align: center;">${row.period}</td>
            <td style="padding: 8px; text-align: right;">${formatValue(row)}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
  };

  return [
    `<br/><hr style="border: 0; border-top: 2px dashed #cbd5e1; margin: 30px 0;"/><br/>`,
    `<h1>${year}년 ESG 상세 확정 실적표</h1>`,
    `<p><strong>보고 범위:</strong> ${scope}</p>`,
    `<p><strong>적용 기준:</strong> ${periodLabel}</p>`,
    "<blockquote style=\"border-left: 4px solid #166534; padding-left: 14px; margin: 10px 0; color: #475569; background-color: #f0fdf4; padding: 12px; border-radius: 4px;\">본 보고서의 표 수치는 기업 ESG 관리자가 등록하고 시스템 총괄 관리자가 최종 승인한 APPROVED 데이터만을 기준으로 작성되었습니다.</blockquote><br/>",
    section("환경(Environment)", byCategory.ENVIRONMENT),
    section("사회(Social)", byCategory.SOCIAL),
    section("거버넌스(Governance)", byCategory.GOVERNANCE),
  ].join("");
};

export default function ReportBuilderPage() {
  const [searchParams] = useSearchParams();
  const requestedYear = Number(searchParams.get("year"));
  const initialYear = Number.isInteger(requestedYear) && requestedYear > 0 ? String(requestedYear) : String(new Date().getFullYear());
  
  const previewRef = useRef(null);
  const quillRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [approvedMetrics, setApprovedMetrics] = useState([]);
  const [isApprovedLoading, setIsApprovedLoading] = useState(false);
  const [approvedError, setApprovedError] = useState("");

  const builderState = useReportBuilder(initialYear);
  const { years: availableYears, loading: periodLoading } = useMetricPeriods({ approvedOnly: true });

  const reportYear = availableYears.includes(Number(builderState.year)) ? String(builderState.year) : String(availableYears[0] || builderState.year);

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
      if (periodLoading) return;
      setIsApprovedLoading(true);
      setApprovedError("");
      try {
        const response = await performanceApi.getPerformanceMetrics(Number(reportYear));
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
    return () => { active = false; };
  }, [periodLoading, reportYear]);

  // [수정] 모달창에서 '적용 및 불러오기' 버튼 클릭 시 트리거되는 통합 함수
  const handleImportApprovedMetrics = () => {
    const scopeFilteredMetrics = approvedMetrics.filter((metric) => {
      const mYear = metric.reportingYear || metric.targetYear || metric.year;
      if (Number(mYear) !== Number(reportYear)) return false;
      if (builderState.scope !== "전체 사업장" && getFacilityName(metric) !== builderState.scope) return false;
      if (builderState.month !== "ALL" && Number(metric.periodValue) !== Number(builderState.month)) return false;
      return true;
    });

    if (!scopeFilteredMetrics.length) {
      window.alert(`${reportYear}년 ${builderState.month === 'ALL' ? '누적' : builderState.month + '월'} 기준 '${builderState.scope}'의 승인 완료 실적이 없습니다.\n(※ 시연 데이터는 2026년 1~5월 구간에만 승인 처리되어 있습니다.)`);
      return;
    }

    if (builderState.content && !window.confirm(`현재 본문을 [${reportYear}년 ${builderState.scope}] 승인 실적 템플릿으로 덮어씌우시겠습니까?`)) return;

    const aggregatedRows = [];
    const grouped = scopeFilteredMetrics.reduce((acc, curr) => {
      const key = `${getFacilityName(curr)}_${curr.indicatorCode}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});

    Object.values(grouped).forEach(group => {
      const first = group[0];
      const code = first.indicatorCode;
      const values = group.map(m => Number(m.numericalValue ?? m.value ?? 0));
      
      let aggValue = values[0];
      if (builderState.month === "ALL") {
        if (code.startsWith("IND_E_")) aggValue = values.reduce((a, b) => a + b, 0);
        else if (code.startsWith("IND_S_")) aggValue = values.reduce((a, b) => a + b, 0) / values.length;
        else aggValue = values[values.length - 1]; 
      }
      
      const maxMonth = group.reduce((max, m) => Math.max(max, Number(m.periodValue || 0)), 0);
      const periodLabel = builderState.month === "ALL" 
        ? (maxMonth > 0 ? `1~${maxMonth}월 누적` : "연간 누적") 
        : `${builderState.month}월 단일`;

      aggregatedRows.push({
        ...first,
        value: aggValue,
        period: periodLabel,
        facilityName: getFacilityName(first)
      });
    });

    const selectedTemplate = builderState.templates?.find(t => t.id === parseInt(builderState.selectedTemplateId));
    let dynamicHtml = selectedTemplate ? selectedTemplate.content : "<p>내용이 없습니다.</p>";

    const indicatorCodes = ["IND_E_ELEC", "IND_E_SCOPE2", "IND_S_INJURY_RATE", "IND_S_SAFETY_EDU", "IND_S_TURNOVER", "IND_G_ATTENDANCE"];
    
    indicatorCodes.forEach(code => {
      const targets = aggregatedRows.filter(r => r.indicatorCode === code);
      let valStr = "데이터 없음";
      
      if (targets.length > 0) {
        let finalValue = targets[0].value;
        if (builderState.scope === "전체 사업장" && targets.length > 1) {
            const allValues = targets.map(t => t.value);
            if (code.startsWith("IND_E_")) finalValue = allValues.reduce((a, b) => a + b, 0);
            else if (code.startsWith("IND_S_")) finalValue = allValues.reduce((a, b) => a + b, 0) / allValues.length;
        }
        valStr = formatValue({ ...targets[0], value: finalValue });
      }
      
      const regex = new RegExp(`{${code}}`, "g");
      dynamicHtml = dynamicHtml.replace(regex, `<span style="color: #047857; background-color: #ecfdf5; font-weight: bold; padding: 2px 4px; border-radius: 4px;">${valStr}</span>`);
    });

    const tablesHtml = buildApprovedPerformanceHtml(aggregatedRows, reportYear, builderState.scope, builderState.month);
    
    builderState.setContent(dynamicHtml + tablesHtml);
    // 모달창 자동으로 닫기
    setIsModalOpen(false);
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
    builderState.setYear(String(availableYears[0] || initialYear));
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
        targetYear: Number(reportYear),
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
                  {isApprovedLoading ? "승인 실적 조회 중..." : approvedError || `${reportYear}년 실적 연동 활성화`}
                </span>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>템플릿 및 설정</Button>
                <Button variant="outline" onClick={() => downloadWord(previewRef, reportYear, builderState.title)}>Word 출력</Button>
                <Button variant="outline" onClick={() => downloadPdf(previewRef, reportYear, builderState.title)}>PDF 출력</Button>
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
            <Card title="실시간 미리보기" description="치환된 데이터와 레이아웃을 확인합니다.">
              <div className="report-builder-scroll preview-editor" ref={previewRef} style={{ flex: 1, overflowY: "auto", padding: "10px", boxSizing: "border-box" }}>
                <span style={{ color: "#166534", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px" }}>{reportYear} SUSTAINABILITY REPORT</span>
                <h1 style={{ borderBottom: "3px solid #166534", paddingBottom: "15px", marginTop: "12px", marginBottom: "24px", fontSize: "28px", color: "#0f172a", wordBreak: "keep-all" }}>
                  {builderState.title || "보고서 제목을 입력해 주세요"}
                </h1>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px", borderBottom: "2px solid #cbd5e1", paddingBottom: "8px" }}>
                  <span>● 보고 연도: {reportYear}년</span> | <span>● 보고 범위: {builderState.scope} ({builderState.month === 'ALL' ? '누적' : builderState.month + '월'})</span>
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
          <Card title="발간 보고서 통제 소스" description="서버에 저장된 리포트 목록과 공개 상태를 관리합니다.">
            {historyState.isHistoryLoading ? (
              <div className="page-loading">보고서 이력을 불러오는 중입니다.</div>
            ) : (
              <DataTable
                rows={historyState.historyRows}
                columns={[
                  { key: "targetYear", label: <div style={{ textAlign: "center", width: "100%" }}>보고연도</div>, render: (val) => <div style={{ textAlign: "center", width: "100%" }}>{val}년</div> },
                  { key: "title", label: <div style={{ textAlign: "center", width: "100%" }}>보고서 제목</div>, render: (val) => <strong>{val}</strong> },
                  { key: "scope", label: <div style={{ textAlign: "center", width: "100%" }}>공간 범위</div> },
                  { key: "version", label: <div style={{ textAlign: "center", width: "100%" }}>공시 버전</div> },
                  { key: "createdAt", label: <div style={{ textAlign: "center", width: "100%" }}>생성 일시</div>, render: (val) => new Date(val).toLocaleString("ko-KR") },
                  { key: "isPublic", label: <div style={{ textAlign: "center", width: "100%" }}>대외공시 상태</div>, render: (val, row) => <div style={{ display: "flex", justifyContent: "center", width: "100%" }}><Button variant={val ? "primary" : "outline"} size="small" onClick={() => historyState.handleTogglePublic(row.id, val)}>{val ? "공개" : "비공개"}</Button></div> },
                  { key: "actions", label: <div style={{ textAlign: "center", width: "100%" }}>관리 기능</div>, render: (_, row) => <div style={{ display: "flex", gap: "6px", justifyContent: "center", width: "100%" }}><Button variant="outline" size="small" onClick={() => handleEditLoad(row)}>수정</Button><Button variant="danger" size="small" onClick={() => historyState.handlePermanentDelete(row.id)}>삭제</Button></div> },
                ]}
                emptyText="저장된 보고서가 없습니다."
              />
            )}
          </Card>
        </div>
      )}

      <ReportSettingsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        builderState={{ ...builderState, year: reportYear }} 
        yearOptions={availableYears} 
        onApply={handleImportApprovedMetrics}
        isLoading={isApprovedLoading}
      />
      <ReportFAB viewMode={historyState.viewMode} setViewMode={historyState.handleViewModeChange} onCreateNew={handleCreateNew} />
    </div>
  );
}