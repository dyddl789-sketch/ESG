import React from "react";

// 아이콘 대신 텍스트로 대체하여 React Hook 충돌을 원천 차단
export default function MetricFilterBar({ filters, onChange }) {
  return (
    <div className="filter-bar">
      <div className="search-input">
        <span style={{ marginRight: '8px' }}>🔍</span>
        <input
          type="text"
          placeholder="지표명 또는 코드 검색..."
          value={filters?.search || ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="filter-group">
        <select
          value={filters?.category || "ALL"}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="ALL">모든 카테고리</option>
          <option value="ENVIRONMENT">환경 (E)</option>
          <option value="SOCIAL">사회 (S)</option>
          <option value="GOVERNANCE">거버넌스 (G)</option>
        </select>
        
        <select
          value={filters?.status || "ALL"}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          <option value="ALL">모든 상태</option>
          <option value="DRAFT">작성 중</option>
          <option value="PENDING">승인 대기</option>
          <option value="REJECTED">반려</option>
          <option value="APPROVED">승인 완료</option>
        </select>
      </div>
    </div>
  );
}
