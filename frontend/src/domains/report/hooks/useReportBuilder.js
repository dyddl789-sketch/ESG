/* 파일 위치: src/domains/report/hooks/useReportBuilder.js */
/* 버전: v1.4 */
/* 기능 요약: React Strict Mode로 인한 임시저장 알림창(confirm) 중복 발생 문제를 해결하기 위해 useRef 플래그를 도입했습니다. */

/* [수정] useRef를 추가로 임포트합니다. */
import { useState, useEffect, useRef } from 'react';
import { reportApi } from '../api/reportApi';

export function useReportBuilder(initialYear = String(new Date().getFullYear())) {
  const [title, setTitle] = useState("에코모빌리티 파츠 ESG 보고서");
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState("ALL");
  const [scope, setScope] = useState("전체 사업장");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [lastSavedTime, setLastSavedTime] = useState("");
  const [showSaveMsg, setShowSaveMsg] = useState(false);
  const [scopesList, setScopesList] = useState(["전체 사업장"]);
  
  /* [수정] 알림창이 두 번 뜨는 것을 막기 위한 단방향 플래그 생성 */
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        console.log("[useReportBuilder] 템플릿 및 사업장 목록 DB 병렬 조회를 시작합니다.");
        const [tplResponse, facResponse] = await Promise.all([
          reportApi.getTemplates(),
          reportApi.getFacilities()
        ]);
        
        const data = tplResponse.data?.data || tplResponse.data;
        setTemplates(data);

        const facData = facResponse.data?.data || facResponse.data;
        if (facData && facData.length > 0) {
          setScopesList(["전체 사업장", ...facData]);
        }
        
        const draft = localStorage.getItem("esg_report_draft");
        if (draft && data && data.length > 0) {
          const parsedDraft = JSON.parse(draft);
          const originalTemplate = data.find(t => t.id === parseInt(parsedDraft.selectedTemplateId)) || data[0];
          
          if (parsedDraft.content === originalTemplate.content) {
            localStorage.removeItem("esg_report_draft");
          } else {
            /* [수정] 이미 한 번 알림창을 띄웠다면 무시하도록 방어 로직 추가 */
            if (!hasPromptedRef.current) {
              hasPromptedRef.current = true; // 스위치를 닫음
              
              if (window.confirm("작성 중이던 임시 저장본이 있습니다. 복구하시겠습니까?")) {
                setTitle(parsedDraft.title);
                setYear(parsedDraft.year);
                setMonth(parsedDraft.month || "ALL");
                setScope(parsedDraft.scope);
                setContent(parsedDraft.content);
                setSelectedTemplateId(parsedDraft.selectedTemplateId);
                return; 
              } else {
                localStorage.removeItem("esg_report_draft"); 
              }
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
      const draft = { title, year, month, scope, selectedTemplateId, content };
      localStorage.setItem("esg_report_draft", JSON.stringify(draft));
      
      const now = new Date();
      setLastSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} 자동 저장됨`);
      setShowSaveMsg(true);
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [title, year, month, scope, selectedTemplateId, content]);

  useEffect(() => {
    if (showSaveMsg) {
      const hideTimer = setTimeout(() => setShowSaveMsg(false), 3000);
      return () => clearTimeout(hideTimer);
    }
  }, [showSaveMsg]);

  return {
    title, setTitle, year, setYear, month, setMonth, scope, setScope,
    content, setContent, isSaving, setIsSaving,
    templates, selectedTemplateId, setSelectedTemplateId,
    lastSavedTime, showSaveMsg,
    scopesList
  };
}