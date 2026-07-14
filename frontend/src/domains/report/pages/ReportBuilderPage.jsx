// 파일 위치: src/domains/report/pages/ReportBuilderPage.jsx
// 버전: v4.4.0
// 기능 요약: 실시간 뷰의 A4 스타일링 제거, 가이드라인 키워드 매칭 오류 수정, 임시 저장 무한 프롬프트 루프 해결

import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; 
import "./ReportBuilderPage.css"; 
import html2pdf from "html2pdf.js";
import { reportApi } from "../api/reportApi";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";

export default function ReportBuilderPage() {
  const previewRef = useRef(null); 
  const quillRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("에코모빌리티 파츠 ESG 보고서");
  const [year, setYear] = useState("2026");
  const [scope, setScope] = useState("전체 사업장");
  const [content, setContent] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [lastSavedTime, setLastSavedTime] = useState("");
  const [showSaveMsg, setShowSaveMsg] = useState(false); 
  const [slashMenu, setSlashMenu] = useState({ visible: false, top: 0, left: 0, index: null });

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (slashMenu.visible && !event.target.closest('.slash-menu')) {
        setSlashMenu({ visible: false, top: 0, left: 0, index: null });
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && slashMenu.visible) {
        setSlashMenu({ visible: false, top: 0, left: 0, index: null });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [slashMenu.visible]);

  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    
    quill.keyboard.addBinding({ key: '/', shiftKey: false }, function(range, context) {
      const bounds = quill.getBounds(range.index);
      setSlashMenu({ visible: true, top: bounds.bottom + 10, left: bounds.left, index: range.index + 1 });
      return true; 
    });
  }, [quillRef]);

  // [수정] 템플릿 호출 및 스마트한 임시 저장 복구 로직
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await reportApi.getTemplates();
        const data = response.data?.data || response.data;
        setTemplates(data);
        
        const draft = localStorage.getItem("esg_report_draft");
        if (draft && data && data.length > 0) {
          const parsedDraft = JSON.parse(draft);
          const originalTemplate = data.find(t => t.id === parseInt(parsedDraft.selectedTemplateId)) || data[0];
          
          // 임시 저장본이 원본 템플릿과 내용이 똑같다면, 묻지 않고 조용히 파기
          if (parsedDraft.content === originalTemplate.content) {
            localStorage.removeItem("esg_report_draft");
          } else {
            if (window.confirm("작성 중이던 임시 저장본이 있습니다. 복구하시겠습니까?")) {
              setTitle(parsedDraft.title);
              setYear(parsedDraft.year);
              setScope(parsedDraft.scope);
              setContent(parsedDraft.content);
              setSelectedTemplateId(parsedDraft.selectedTemplateId);
              return; 
            } else {
              localStorage.removeItem("esg_report_draft"); 
            }
          }
        }

        if (data && data.length > 0) {
          setSelectedTemplateId(data[0].id);
          setContent(data[0].content);
        }
      } catch (error) {
        console.error("템플릿 목록을 불러오는 데 실패했습니다.", error);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!content) return;
    const saveTimer = setTimeout(() => {
      const draft = { title, year, scope, selectedTemplateId, content };
      localStorage.setItem("esg_report_draft", JSON.stringify(draft));
      
      const now = new Date();
      setLastSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} 자동 저장됨`);
      setShowSaveMsg(true);
      
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [title, year, scope, selectedTemplateId, content]);

  useEffect(() => {
    if (showSaveMsg) {
      const hideTimer = setTimeout(() => setShowSaveMsg(false), 3000);
      return () => clearTimeout(hideTimer);
    }
  }, [showSaveMsg]);

  const insertSlashCommand = (type) => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    quill.deleteText(slashMenu.index - 1, 1); 
    
    let html = "";
    if (type === "table") {
      html = `<table style="width: 100%; border-collapse: collapse;" border="1"><tbody><tr><td style="padding: 8px; background-color: #f1f5f9;"><strong>구분</strong></td><td style="padding: 8px; background-color: #f1f5f9;"><strong>목표</strong></td><td style="padding: 8px; background-color: #f1f5f9;"><strong>실적</strong></td></tr><tr><td style="padding: 8px;"><br></td><td style="padding: 8px;"><br></td><td style="padding: 8px;"><br></td></tr></tbody></table><p><br></p>`;
    } else if (type === "quote") {
      html = `<blockquote style="border-left: 4px solid #166534; padding-left: 14px; margin: 10px 0; color: #475569; background-color: #f0fdf4; padding: 12px; border-radius: 4px;">여기에 핵심 요약문을 작성하세요.</blockquote><p><br></p>`;
    } else if (type === "sign") {
      html = `<p style="text-align: right;"><strong>작성자:</strong> ____________ (인)&nbsp;&nbsp;&nbsp;&nbsp;<strong>승인자:</strong> ____________ (인)</p><p><br></p>`;
    }

    quill.clipboard.dangerouslyPasteHTML(slashMenu.index - 1, html);
    setSlashMenu({ visible: false, top: 0, left: 0, index: null });
    setContent(quill.root.innerHTML);
  };

  const handleTemplateChange = (e) => {
    const newTemplateId = e.target.value;
    setSelectedTemplateId(newTemplateId);
    const selectedTemplate = templates.find(t => t.id === parseInt(newTemplateId));
    if (selectedTemplate && selectedTemplate.content) {
      if(window.confirm("템플릿을 변경하면 현재 작성 중인 내용이 지워집니다. 변경하시겠습니까?")) {
        setContent(selectedTemplate.content);
      }
    }
  };

  const handleDownloadPdf = () => {
    const element = previewRef.current;
    const opt = {
      margin:       15,
      filename:     `${year}_${title}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadWord = () => {
    const element = previewRef.current;
    if (!element) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>ESG Report</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + element.innerHTML + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${year}_${title}_초안.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

const handleSaveReport = async () => {
    // 기능 설명: 작성자에게 최종 저장 의사를 묻고 취소 클릭 시 함수 실행을 즉시 중단합니다.
    const isConfirm = window.confirm("작성하신 보고서의 최종 내용을 서버에 공시 저장하시겠습니까?");
    console.log("보고서 최종 저장 컨펌 창 선택 결과:", isConfirm);
    
    if (!isConfirm) {
      return;
    }

    setIsSaving(true);
    try {
      const dummyFileUrl = "https://example.com/downloads/generated-report.pdf";
      const requestData = { templateId: parseInt(selectedTemplateId), title, content, targetYear: parseInt(year), scope, version: "v1.0", fileUrl: dummyFileUrl, isPublic: false };
      
      console.log("보고서 공시 API 전송 데이터 스캔:", requestData);
      await reportApi.generate(requestData);
      
      localStorage.removeItem("esg_report_draft"); 
      alert("보고서가 서버에 성공적으로 공시 저장되었습니다.");
    } catch (error) {
      console.error("보고서 저장 에러:", error);
      alert("보고서 저장 실패: 관리자에게 문의하세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack report-page" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      
      <PageHeader 
        breadcrumbs={["성과·보고", "리포트 빌더"]} 
        title="ESG 보고서 작성" 
        description="에디터에서 '/' 문자를 입력하여 서식을 삽입하세요. (2초 자동 저장)" 
        actions={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ 
              fontSize: "13px", 
              color: "#10b981", 
              marginRight: "8px", 
              fontWeight: "500",
              transition: "opacity 0.5s ease-in-out",
              opacity: showSaveMsg ? 1 : 0 
            }}>
              ✓ {lastSavedTime}
            </span>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>기본 설정</Button>
            <Button variant="primary" onClick={handleDownloadWord}>Word 출력</Button>
            <Button variant="primary" onClick={handleDownloadPdf}>PDF 출력</Button>
            <Button onClick={handleSaveReport} disabled={isSaving}>
              {isSaving ? "저장 중..." : "최종 내용 저장"}
            </Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: "24px", flex: 1, marginTop: "16px", minHeight: 0 }}>
        
        {/* [수정] A4 껍데기를 모두 걷어내고 에디터와 1:1로 동일한 패딩과 구조 적용 */}
        <div className="equal-height-card-wrapper" style={{ flex: 1 }}>
          <Card title="실시간 미리보기">
            <div 
              className="report-builder-scroll" 
              ref={previewRef}
              style={{ flex: 1, overflowY: "auto", padding: "10px", boxSizing: "border-box" }}>
              <span style={{ color: "#166534", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px" }}>
                {year} SUSTAINABILITY REPORT
              </span>
              <h1 style={{ borderBottom: "3px solid #166534", paddingBottom: "15px", marginTop: "12px", marginBottom: "24px", fontSize: "28px", color: "#0f172a" }}>
                {title || "보고서 제목을 입력해주세요"}
              </h1>
              
              <div className="readonly-editor">
                <ReactQuill 
                  theme="snow" 
                  value={content} 
                  readOnly={true} 
                  modules={{ toolbar: false }} 
                />
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
                ref={quillRef} theme="snow" value={content} onChange={(v, d, s) => { if(s === 'user') setContent(v); }} modules={modules} style={{ height: "100%" }} placeholder="내용을 작성하거나 영문 '/'를 눌러 도구를 호출하세요..." 
              />
            </div>
          </Card>
        </div>

      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>보고서 기본 설정</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>적용할 템플릿</span>
                <select value={selectedTemplateId} onChange={handleTemplateChange} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                  <option value="" disabled>템플릿을 선택하세요</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.title || `템플릿 #${template.id}`}
                    </option>
                  ))}
                </select>
              </label>
              
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>보고서 제목</span>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              </label>

              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <span style={{ fontWeight: "600", fontSize: "14px" }}>보고 연도</span>
                  <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                    <option value="2026">2026년</option>
                    <option value="2025">2025년</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <span style={{ fontWeight: "600", fontSize: "14px" }}>보고 범위</span>
                  <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                    <option value="전체 사업장">전체 사업장</option>
                    <option value="부산공장">부산공장</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <Button onClick={() => setIsModalOpen(false)}>확인</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}