// 파일 위치: src/domains/report/pages/ReportBuilderPage.jsx
// 버전: v2.0.0
// 기능 요약: DB 템플릿 연동을 위해 useEffect를 임포트하고, 템플릿 목록(templates)과 선택된 템플릿 ID(selectedTemplateId) 상태를 추가합니다.
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
  const [content, setContent] = useState(
    "<h2>Executive Summary</h2><p>2026년 상반기 온실가스 배출량은 전년 동기 대비 <strong>12.6% 감소</strong>했습니다.</p>"
  );
  
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
    setContent(content + "<br/><p><strong>AI 분석 결과</strong>: 울산공장의 전력 사용량 증가 원인은 추가 확인이 필요합니다.</p>");
  };

  // 1. PDF 출력 로직 단독 분리
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

  // 2. 최종 내용 백엔드 저장 로직
  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      // 더미 URL이지만 백엔드 유효성 검사 통과를 위해 필수적인 값입니다.
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

      console.log("백엔드로 전송하는 데이터 패킷:", requestData);
      
      await reportApi.generate(requestData);
      
      alert("보고서가 서버에 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("보고서 저장 실패:", error);
      if (error.response && error.response.data) {
        console.error("400 에러 상세 원인:", error.response.data);
      }
      alert("보고서 저장 실패: 필수 항목이 누락되었거나 데이터 형식이 맞지 않습니다. (콘솔 확인 요망)");
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
        {/* 콘솔 로그: 좌측 실시간 뷰 패널 렌더링 확인 */}
        {console.log("좌측 실시간 뷰 패널 렌더링 바인딩")}
        <div className="equal-height-card-wrapper">
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
              {/* 에디터와 동일한 CSS 환경(ql-snow)을 부여하고, 빈 줄바꿈 유지를 위해 preview-editor 클래스를 추가합니다. */}
              <div className="ql-snow">
                <div className="ql-editor preview-editor" style={{ padding: 0, fontSize: "16px", color: "#334155" }} dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          </Card>
        </div>

        {/* [우측] 에디터 단독 뷰 영역 */}
        {/* 콘솔 로그: 우측 본문 편집기 패널 렌더링 확인 */}
        {console.log("우측 에디터 패널 렌더링 바인딩")}
        <div className="equal-height-card-wrapper">
          <Card title="본문 편집">
            <div className="no-border-editor" style={{ flex: 1, paddingBottom: "10px" }}>
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} style={{ height: "100%" }} placeholder="보고서의 세부 내용을 작성해주세요..." />
            </div>
          </Card>
        </div>

      </div>

      // 파일 위치: src/domains/report/pages/ReportBuilderPage.jsx
// 버전: v2.0.2
// 기능 요약: 템플릿 드롭다운 목록에서 이름이 정상적으로 노출되도록 JSON 필드 참조 변수를 template.name에서 백엔드 DTO 규격인 template.title로 변경합니다.
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