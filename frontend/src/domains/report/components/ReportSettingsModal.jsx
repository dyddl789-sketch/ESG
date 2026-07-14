import React from "react";
import Button from "../../../shared/components/Button";

export default function ReportSettingsModal({ 
  isOpen, 
  onClose, 
  builderState 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>보고서 기본 설정</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontWeight: "600", fontSize: "14px" }}>적용할 템플릿</span>
            <select 
              value={builderState.selectedTemplateId} 
              onChange={(e) => {
                const newId = e.target.value;
                builderState.setSelectedTemplateId(newId);
                const sel = builderState.templates.find(t => t.id === parseInt(newId));
                if (sel && window.confirm("템플릿을 변경하면 내용이 지워집니다. 변경하시겠습니까?")) {
                  builderState.setContent(sel.content);
                }
              }} 
              style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            >
              <option value="" disabled>템플릿을 선택하세요</option>
              {builderState.templates.map(template => (
                <option key={template.id} value={template.id}>{template.title || `템플릿 #${template.id}`}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontWeight: "600", fontSize: "14px" }}>보고서 제목</span>
            <input type="text" value={builderState.title} onChange={(e) => builderState.setTitle(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
          </label>
          <div style={{ display: "flex", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>보고 연도</span>
              <select value={builderState.year} onChange={(e) => builderState.setYear(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                <option value="2026">2026년</option>
                <option value="2025">2025년</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>보고 범위</span>
              <select value={builderState.scope} onChange={(e) => builderState.setScope(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                <option value="전체 사업장">전체 사업장</option>
                <option value="부산공장">부산공장</option>
              </select>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <Button onClick={onClose}>확인</Button>
          </div>
        </div>
      </div>
    </div>
  );
}