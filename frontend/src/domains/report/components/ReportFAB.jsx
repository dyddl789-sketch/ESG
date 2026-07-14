import React, { useState } from "react";

export default function ReportFAB({ viewMode, setViewMode, onCreateNew }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fab-container" onMouseLeave={() => setIsOpen(false)}>
      
      {/* 십자 버튼 (메인) */}
      <button 
        className="fab-main-button" 
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* 서브 메뉴 목록 */}
      {isOpen && (
        <div className="fab-menu-list">
          <button className="fab-item-button" onClick={onCreateNew}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            새로 작성
          </button>
          
          <button 
            className={`fab-item-button ${viewMode === "WRITE" ? "active" : ""}`} 
            onClick={() => setViewMode("WRITE")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            현재 에디터
          </button>

          <button 
            className={`fab-item-button ${viewMode === "HISTORY" ? "active" : ""}`} 
            onClick={() => setViewMode("HISTORY")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            작성 이력 조회
          </button>
        </div>
      )}
    </div>
  );
}