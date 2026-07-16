import React, { useState, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; 
import "./ReportBuilderPage.css"; 
import { reportApi } from "../api/reportApi";

import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";

import { useReportBuilder } from "../hooks/useReportBuilder";
import { useSlashMenu } from "../hooks/useSlashMenu";
import { useReportHistory } from "../hooks/useReportHistory";
import { downloadPdf, downloadWord } from "../utils/reportExportUtils";

// 분리한 하위 컴포넌트 임포트
import ReportSettingsModal from "../components/ReportSettingsModal";
import ReportFAB from "../components/ReportFAB";

export default function ReportBuilderPage() {
  const previewRef = useRef(null); 
  const quillRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const builderState = useReportBuilder();
  const { slashMenu, insertSlashCommand } = useSlashMenu(quillRef, builderState.setContent);
  const historyState = useReportHistory();

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
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
    if(window.confirm("현재 에디터의 내용이 초기화됩니다. 새 보고서를 작성하시겠습니까?")) {
      builderState.setTitle("새 ESG 보고서");
      builderState.setYear("2026");
      builderState.setScope("전체 사업장");
      builderState.setContent("");
      if (builderState.templates && builderState.templates.length > 0) {
        builderState.setSelectedTemplateId(String(builderState.templates[0].id));
      }
      historyState.setViewMode("WRITE");
    }
  };

  const handleSaveReport = async () => {
    if (!window.confirm("작성하신 보고서의 최종 내용을 서버에 공시 저장하시겠습니까?")) return;
    builderState.setIsSaving(true);
    try {
      await reportApi.generate({ 
        templateId: parseInt(builderState.selectedTemplateId), 
        title: builderState.title, 
        content: builderState.content, 
        targetYear: parseInt(builderState.year), 
        scope: builderState.scope, 
        version: "v1.0", 
        fileUrl: "https://example.com/downloads/generated-report.pdf", 
        isPublic: false 
      });
      localStorage.removeItem("esg_report_draft"); 
      alert("보고서가 서버에 성공적으로 공시 저장되었습니다.");
      historyState.handleViewModeChange("HISTORY"); 
    } catch (error) {
      alert("보고서 저장 실패: 관리자에게 문의하세요.");
    } finally {
      builderState.setIsSaving(false);
    }
  };

  return (
    <div className="page-stack report-page" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PageHeader 
        breadcrumbs={["성과·보고", "리포트 빌더"]} 
        title={<span style={{ whiteSpace: "nowrap" }}>ESG 보고서 시스템</span>} 
        description={<span style={{ whiteSpace: "nowrap", display: "inline-block" }}>사내 공시 보고서를 수기 빌드 및 관리하며 이력 데이터를 검토합니다.</span>} 
        actions={
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "nowrap", justifyContent: "flex-end", width: "auto", marginRight: "-24px" }}>
            {historyState.viewMode === "WRITE" && (
              <>
                <span style={{ flexShrink: 0, fontSize: "13px", color: "#10b981", marginRight: "4px", fontWeight: "500", transition: "opacity 0.5s", opacity: builderState.showSaveMsg ? 1 : 0, whiteSpace: "nowrap" }}>
                  ✓ {builderState.lastSavedTime}
                </span>
                
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    기본 설정
                  </span>
                </Button>

                <Button variant="outline" onClick={() => downloadWord(previewRef, builderState.year, builderState.title)}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 12l1.5 5 1.5-3 1.5 3 1.5-5"></path></svg>
                    Word 출력
                  </span>
                </Button>

                <Button variant="outline" onClick={() => downloadPdf(previewRef, builderState.year, builderState.title)}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    PDF 출력
                  </span>
                </Button>
                
                <Button variant="primary" onClick={handleSaveReport} disabled={builderState.isSaving}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    {builderState.isSaving ? "저장 중..." : "최종 내용 저장"}
                  </span>
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* 에디터 / 이력 탭 렌더링 부 */}
      {historyState.viewMode === "WRITE" && (
        <div style={{ display: "flex", gap: "24px", flex: 1, marginTop: "16px", minHeight: 0 }}>
          {/* 좌측 실시간 뷰어 */}
          <div className="equal-height-card-wrapper" style={{ flex: 1, minWidth: "50%" }}>
            <Card title="실시간 미리보기">
              <div className="report-builder-scroll preview-editor" ref={previewRef} style={{ flex: 1, overflowY: "auto", padding: "10px", boxSizing: "border-box" }}>
                <span style={{ color: "#166534", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px" }}>{builderState.year} SUSTAINABILITY REPORT</span>
                <h1 style={{ borderBottom: "3px solid #166534", paddingBottom: "15px", marginTop: "12px", marginBottom: "24px", fontSize: "28px", color: "#0f172a", wordBreak: "keep-all" }}>
                  {builderState.title || "보고서 제목을 입력해주세요"}
                </h1>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px", borderBottom: "2px solid #cbd5e1", paddingBottom: "8px" }}>
                  <span>● 보고 연도: {builderState.year}년</span> | <span>● 보고 범위: {builderState.scope}</span>
                </div>
                <div className="readonly-editor">
                  <ReactQuill theme="snow" value={builderState.content} readOnly={true} modules={{ toolbar: false }} />
                </div>
              </div>
            </Card>
          </div>

          {/* 우측 에디터 */}
          <div className="equal-height-card-wrapper" style={{ flex: 1, position: "relative", minWidth: "50%" }}>
            <Card title="본문 편집">
              <div className="no-border-editor" style={{ flex: 1, paddingBottom: "10px", position: "relative" }}>
                {slashMenu.visible && (
                  <div className="slash-menu" style={{ top: slashMenu.top, left: slashMenu.left }}>
                    <div style={{ padding: "4px 16px", fontSize: "12px", color: "#94a3b8", fontWeight: "bold" }}>블록 삽입</div>
                    <div className="slash-menu-item" onClick={() => insertSlashCommand("table")}>📊 2x2 데이터 표 (Table)</div>
                    <div className="slash-menu-item" onClick={() => insertSlashCommand("quote")}>💡 강조 요약문 (Quote)</div>
                    <div className="slash-menu-item" onClick={() => insertSlashCommand("sign")}>✍️ 임원 결재 서명란 (Sign)</div>
                  </div>
                )}
                <ReactQuill ref={quillRef} theme="snow" value={builderState.content} onChange={(v, d, s) => { if(s === 'user') builderState.setContent(v); }} modules={modules} style={{ height: "100%" }} placeholder="내용을 작성하거나 영문 '/'를 눌러 도구를 호출하세요..." />
              </div>
            </Card>
          </div>
        </div>
      )}

      {historyState.viewMode === "HISTORY" && (
        <div style={{ marginTop: "20px", flex: 1, overflowY: "auto" }}>
          <Card title="발간 보고서 통제 소스" description="공시 적재 완료된 리포트 리스트입니다. 실무 담당자는 데이터를 물리 삭제 없이 소프트 제외하거나 대외 노출 상태값을 실시간 스위칭할 수 있습니다.">
            {historyState.isHistoryLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>이력 데이터를 로드하고 있습니다...</div>
            ) : (
              <DataTable rows={historyState.historyRows} columns={[
                  { key: "targetYear", label: "보고연도", render: (val) => `${val}년` },
                  { key: "title", label: "보고서 제목", render: (val) => <strong>{val}</strong> },
                  { key: "scope", label: "공간 범위" },
                  { key: "version", label: "공시 버전" },
                  { key: "createdAt", label: "생성 일시", render: (val) => new Date(val).toLocaleString("ko-KR") },
                  { key: "isPublic", label: "대외공시 상태", render: (val, row) => (<Button variant={val ? "primary" : "outline"} size="small" onClick={() => historyState.handleTogglePublic(row.id, val)}>{val ? "공개" : "비공개"}</Button>)},
                  { key: "actions", label: "관리 기능", render: (_, row) => (<div style={{ display: "flex", gap: "6px" }}><Button variant="outline" size="small" onClick={() => handleEditLoad(row)}>수정</Button><Button variant="danger" size="small" onClick={() => historyState.handlePermanentDelete(row.id)}>삭제</Button></div>)}
                ]} />
            )}
          </Card>
        </div>
      )}

      {/* 분리된 모달 컴포넌트 호출 */}
      <ReportSettingsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} builderState={builderState} />

      {/* 분리된 FAB 컴포넌트 호출 */}
      <ReportFAB viewMode={historyState.viewMode} setViewMode={historyState.handleViewModeChange} onCreateNew={handleCreateNew} />
    </div>
  );
}