// 파일 위치: src/domains/report/pages/ReportBuilderPage.jsx
// 버전: v5.3.0
// 기능 요약: 다운로드 버튼을 제거하고 이력 아카이브 테이블을 수정, 영구 삭제, 대외 공시 상태 스위치로 전면 재구성합니다.

import React, { useState, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; 
import "./ReportBuilderPage.css"; 
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";

import { useReportBuilder } from "../hooks/useReportBuilder";
import { useSlashMenu } from "../hooks/useSlashMenu";
import { useReportHistory } from "../hooks/useReportHistory";
import { downloadPdf, downloadWord } from "../utils/reportExportUtils";

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

  /* 기능 설명: 아카이브에서 [수정] 클릭 시 해당 로우 데이터를 에디터 폼으로 역방향 바인딩 로드합니다. */
  const handleEditLoad = (row) => {
    builderState.setTitle(row.title);
    builderState.setYear(String(row.targetYear));
    builderState.setScope(row.scope);
    builderState.setContent(row.content);
    builderState.setSelectedTemplateId(String(row.templateId));
    historyState.setViewMode("WRITE"); // 편집 탭으로 뷰 모드 자동 이동
  };

  return (
    <div className="page-stack report-page" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PageHeader 
        breadcrumbs={["성과·보고", "리포트 빌더"]} 
        title="ESG 보고서 시스템" 
        description="사내 공시 보고서를 수기 빌드 및 관리하며 이력 데이터를 검토합니다." 
        actions={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {historyState.viewMode === "WRITE" && (
              <>
                <span style={{ fontSize: "13px", color: "#10b981", marginRight: "8px", fontWeight: "500", transition: "opacity 0.5s ease-in-out", opacity: builderState.showSaveMsg ? 1 : 0 }}>
                  ✓ {builderState.lastSavedTime}
                </span>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>기본 설정</Button>
                <Button variant="outline" onClick={() => downloadWord(previewRef, builderState.year, builderState.title)}>Word 출력</Button>
                <Button variant="outline" onClick={() => downloadPdf(previewRef, builderState.year, builderState.title)}>PDF 출력</Button>
                <Button variant="primary" onClick={builderState.handleSaveReport} disabled={builderState.isSaving}>
                  {builderState.isSaving ? "저장 중..." : "최종 내용 저장"}
                </Button>
                <div style={{ width: "1px", height: "24px", backgroundColor: "#cbd5e1", margin: "0 8px" }}></div>
              </>
            )}
            <Button variant={historyState.viewMode === "WRITE" ? "primary" : "outline"} onClick={() => historyState.handleViewModeChange("WRITE")}>보고서 작성</Button>
            <Button variant={historyState.viewMode === "HISTORY" ? "primary" : "outline"} onClick={() => historyState.handleViewModeChange("HISTORY")}>작성 이력 조회</Button>
          </div>
        }
      />

      {/* 탭 가상 분기 영역 1: 에디터 작성 화면 */}
      {historyState.viewMode === "WRITE" && (
        <div style={{ display: "flex", gap: "24px", flex: 1, marginTop: "16px", minHeight: 0 }}>
          <div className="equal-height-card-wrapper" style={{ flex: 1 }}>
            <Card title="실시간 미리보기">
              <div className="report-builder-scroll" ref={previewRef} style={{ flex: 1, overflowY: "auto", padding: "10px", boxSizing: "border-box" }}>
                <span style={{ color: "#166534", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px" }}>
                  {builderState.year} SUSTAINABILITY REPORT
                </span>
                <h1 style={{ borderBottom: "3px solid #166534", paddingBottom: "15px", marginTop: "12px", marginBottom: "24px", fontSize: "28px", color: "#0f172a" }}>
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

          <div className="equal-height-card-wrapper" style={{ flex: 1, position: "relative" }}>
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
                <ReactQuill 
                  ref={quillRef} theme="snow" value={builderState.content} 
                  onChange={(v, d, s) => { if(s === 'user') builderState.setContent(v); }} 
                  modules={modules} style={{ height: "100%" }} placeholder="내용을 작성하거나 영문 '/'를 눌러 도구를 호출하세요..." 
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 탭 가상 분기 영역 2: 작성 이력 조회 화면 (원클릭 다운로드 완벽 제거) */}
      {historyState.viewMode === "HISTORY" && (
        <div style={{ marginTop: "20px", flex: 1, overflowY: "auto" }}>
          <Card title="발간 보고서 이력 아카이브" description="서버 공시 데이터베이스에 직결 보존된 보고서 이력 명세입니다. 데이터를 실시간 수정하거나 완전히 파기 처분할 수 있습니다.">
            {historyState.isHistoryLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>이력 데이터를 로드하고 있습니다...</div>
            ) : (
              <DataTable
                rows={historyState.historyRows}
                columns={[
                  { key: "targetYear", label: "보고연도", render: (val) => `${val}년` },
                  { key: "title", label: "보고서 제목", render: (val) => <strong>{val}</strong> },
                  { key: "scope", label: "공간 범위" },
                  { key: "version", label: "공시 버전" },
                  { key: "createdAt", label: "생성 일시", render: (val) => new Date(val).toLocaleString("ko-KR") },
                  /* 대외 공시 여부 스위치형 토글 컬럼 */
                  { key: "isPublic", label: "대외공시", render: (val, row) => (
                    <Button variant={val ? "primary" : "outline"} size="small" onClick={() => historyState.handleTogglePublic(row.id, val)}>
                      {val ? "공개 완료" : "비공개"}
                    </Button>
                  )},
                  /* [수정 반영] 다운로드 칼럼을 제거하고 실무 데이터 수정 / 영구 삭제 컬럼 매핑 */
                  { key: "management", label: "관리 기능", render: (_, row) => (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Button variant="outline" size="small" onClick={() => handleEditLoad(row)}>수정</Button>
                      <Button variant="danger" size="small" onClick={() => historyState.handlePermanentDelete(row.id)}>삭제</Button>
                    </div>
                  )}
                ]}
              />
            )}
          </Card>
        </div>
      )}

      {/* 설정 모달 영역 v5.1.0 구조 동일 유지로 생략 */}
    </div>
  );
}