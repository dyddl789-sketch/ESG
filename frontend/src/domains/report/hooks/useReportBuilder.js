// 파일 위치: src/domains/report/hooks/useReportBuilder.js
import { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';

export function useReportBuilder(initialYear = String(new Date().getFullYear())) {
  const [title, setTitle] = useState("에코모빌리티 파츠 ESG 보고서");
  const [year, setYear] = useState(initialYear);
  const [scope, setScope] = useState("전체 사업장");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [lastSavedTime, setLastSavedTime] = useState("");
  const [showSaveMsg, setShowSaveMsg] = useState(false);
  const [scopesList, setScopesList] = useState(["전체 사업장"]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        console.log("[useReportBuilder v1.2] 템플릿 및 사업장 목록 DB 병렬 조회를 시작합니다.");
        const [tplResponse, facResponse] = await Promise.all([
          reportApi.getTemplates(),
          reportApi.getFacilities()
        ]);
        
        const data = tplResponse.data?.data || tplResponse.data;
        console.log("[useReportBuilder v1.2] 템플릿 데이터 세팅 완료");
        setTemplates(data);

        const facData = facResponse.data?.data || facResponse.data;
        if (facData && facData.length > 0) {
          console.log("[useReportBuilder v1.2] DB 사업장 목록 세팅 완료:", facData);
          setScopesList(["전체 사업장", ...facData]);
        }
        
        const draft = localStorage.getItem("esg_report_draft");
        if (draft && data && data.length > 0) {
          const parsedDraft = JSON.parse(draft);
          const originalTemplate = data.find(t => t.id === parseInt(parsedDraft.selectedTemplateId)) || data[0];
          
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
        console.error("템플릿 목록 획득 실패:", error);
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

  return {
    title, setTitle, year, setYear, scope, setScope,
    content, setContent, isSaving, setIsSaving,
    templates, selectedTemplateId, setSelectedTemplateId,
    lastSavedTime, showSaveMsg,
    scopesList
  };
}