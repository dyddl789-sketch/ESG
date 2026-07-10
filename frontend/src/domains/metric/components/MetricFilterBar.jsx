import React from "react";
import { Search } from "lucide-react";

export default function MetricFilterBar({ filters, onChange }) {
  return (
    <div className="filter-bar">
      <div className="search-input">
        <Search size={16} />
        <input
          type="text"
          placeholder="지표명 또는 코드 검색..."
          value={filters.search || ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="filter-group">
        <select
          value={filters.category || "ALL"}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="ALL">모든 카테고리</option>
          <option value="ENVIRONMENT">환경 (E)</option>
          <option value="SOCIAL">사회 (S)</option>
          <option value="GOVERNANCE">거버넌스 (G)</option>
        </select>
        
        {/* 상태 필터는 이미 상단 Tabs에서 관리 중일 수 있으나, 필요시 추가 유지 */}
        <select
          value={filters.status || "ALL"}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          <option value="ALL">모든 상태</option>
          <option value="DRAFT">검토 중</option>
          <option value="PENDING">승인 대기</option>
          <option value="REJECTED">반려</option>
          <option value="APPROVED">승인 완료</option>
        </select>
      </div>
    </div>
  );
}
