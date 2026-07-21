// 파일 위치: src/domains/report/components/ReportSettingsModal.js

import React from "react";
import Button from "../../../shared/components/Button";

export default function ReportSettingsModal({ 
  isOpen, 
  onClose, 
  builderState,
  yearOptions = [],
  onApply,
  isLoading
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: "480px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>템플릿 및 실적 불러오기</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontWeight: "600", fontSize: "14px" }}>적용할 템플릿</span>
            <select 
              value={builderState.selectedTemplateId || ""} 
              onChange={(e) => builderState.setSelectedTemplateId(e.target.value)} 
              style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            >
              <option value="" disabled>템플릿을 선택하세요</option>
              {builderState.templates?.map(template => (
                <option key={template.id} value={template.id}>{template.title || `템플릿 #${template.id}`}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontWeight: "600", fontSize: "14px" }}>보고서 제목</span>
            <input type="text" value={builderState.title || ""} onChange={(e) => builderState.setTitle(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
          </label>
          <div style={{ display: "flex", gap: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>보고 연도</span>
              <select value={builderState.year || ""} onChange={(e) => builderState.setYear(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>{year}년</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>보고 월</span>
              <select value={builderState.month || "ALL"} onChange={(e) => builderState.setMonth && builderState.setMonth(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                {/* [수정] 텍스트를 '전체 누적'에서 '현재 누적 (합산/평균)'으로 변경 */}
                <option value="ALL">현재 누적 (합산/평균)</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>보고 범위</span>
              <select value={builderState.scope || ""} onChange={(e) => builderState.setScope(e.target.value)} style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                {builderState.scopesList?.map((scopeOption, index) => (
                  <option key={index} value={scopeOption}>
                    {scopeOption}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px", gap: "8px" }}>
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={() => onApply()} disabled={isLoading}>
              {isLoading ? "데이터 조회 중..." : "설정 적용 및 불러오기"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}