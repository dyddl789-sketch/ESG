import React from "react";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function MetricDataGrid({ rows = [], onRowClick }) {
  return (
    <div className="data-grid-wrapper">
      <table className="data-grid">
        <thead>
          <tr>
            <th>분류</th>
            <th>코드</th>
            <th>지표명</th>
            <th>시설/사업장</th>
            <th>기간</th>
            <th className="text-right">측정값</th>
            <th>단위</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick(row)} className="clickable">
              <td className="dim">{row.category}</td>
              <td><code>{row.indicatorCode}</code></td>
              <td className="font-medium">{row.title}</td>
              <td>{row.facility}</td>
              <td className="dim">{row.year} / {row.period}</td>
              <td className="text-right font-bold">{row.value?.toLocaleString()}</td>
              <td className="dim text-sm">{row.unit}</td>
              <td><StatusBadge status={row.status} /></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="8" className="empty">조회된 데이터가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
