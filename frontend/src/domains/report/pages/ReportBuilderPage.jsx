// 파일 위치: src/domains/report/pages/ReportBuilderPage.jsx
// 버전: v3.0.0
// 기능 요약: 좌측 실시간 뷰를 HTML 렌더링이 아닌 '읽기 전용 에디터(ReactQuill)'로 교체하여 작업뷰와의 100% 렌더링 일치를 보장합니다.
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("에코모빌리티 파츠 ESG 보고서");
  const [year, setYear] = useState("2026");
  const [scope, setScope] = useState("전체 사업장");
  const [content, setContent] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

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
    const fetchTemplates = async () => {
      try {
        const response = await reportApi.getTemplates();
        const data = response.data?.data || response.data;
        setTemplates(data);
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

  const handleTemplateChange = (e) => {
    const newTemplateId = e.target.value;
    setSelectedTemplateId(newTemplateId);
    
    const selectedTemplate = templates.find(t => t.id === parseInt(newTemplateId));
    if (selectedTemplate && selectedTemplate.content) {
      setContent(selectedTemplate.content);
    }
  };

  const generateAiDraft = () => {
    setContent(content + "<p><br></p><p><strong>AI 분석 결과</strong>: 울산공장의 전력 사용량 증가 원인은 추가 확인이 필요합니다.</p>");
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

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const dummyFileUrl = "https://example.com/downloads/generated-report.pdf";
      const requestData = {
        templateId: parseInt(selectedTemplateId), 
        title: title,               
        content: content,           
        targetYear: parseInt(year), 
        scope: scope,               
        version: "v1.0",            
        fileUrl: dummyFileUrl,      
        isPublic: false             
      };
      await reportApi.generate(requestData);
      alert("보고서가 서버에 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("보고서 저장 실패:", error);
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
        description="우측 설정에서 내용을 작성하면 좌측에 실시간으로 반영됩니다." 
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>기본 설정</Button>
            <Button variant="outline" onClick={generateAiDraft}>AI 초안 생성</Button>
            <Button variant="primary" onClick={handleDownloadPdf}>PDF 출력</Button>
            <Button onClick={handleSaveReport} disabled={isSaving}>
              {isSaving ? "저장 중..." : "최종 내용 저장"}
            </Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: "24px", flex: 1, marginTop: "16px", minHeight: 0 }}>
        
        {/* [좌측] 실시간 뷰 영역 */}
        <div className="equal-height-card-wrapper">
          <Card title="실시간 미리보기">
            <div 
              className="report-builder-scroll" 
              ref={previewRef}
              style={{ flex: 1, overflowY: "auto", padding: "10px", boxSizing: "border-box" }}>
              <span style={{ color: "#166534", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px", marginLeft: "15px" }}>
                {year} SUSTAINABILITY REPORT
              </span>
              <h1 style={{ borderBottom: "3px solid #166534", paddingBottom: "15px", marginTop: "12px", marginBottom: "24px", fontSize: "28px", color: "#0f172a", marginLeft: "15px", marginRight: "15px" }}>
                {title || "보고서 제목을 입력해주세요"}
              </h1>
              
              {/* [핵심 해결] 실시간 뷰를 작업뷰와 똑같은 에디터로 처리하되 수정만 불가능(readOnly)하게 하여 100% 동일한 렌더링을 보장합니다. */}
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

        {/* [우측] 에디터 단독 뷰 영역 */}
        <div className="equal-height-card-wrapper">
          <Card title="본문 편집">
            <div className="no-border-editor" style={{ flex: 1, paddingBottom: "10px" }}>
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} style={{ height: "100%" }} placeholder="보고서의 세부 내용을 작성해주세요..." />
            </div>
          </Card>
        </div>

      </div>

      {/* 기본 설정 모달창 */}
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