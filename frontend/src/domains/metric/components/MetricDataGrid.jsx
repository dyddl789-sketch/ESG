import React from "react";
import StatusBadge from "../../../shared/components/StatusBadge";

/**
 * [수정 포인트]
 * - 백엔드 MyBatis에서 numerical_value(BigDecimal)가 JSON 직렬화될 때
 *   숫자 또는 문자열로 내려올 수 있으므로 Number() 변환 후 표시한다.
 *   (문자열에 .toLocaleString()을 호출하면 천단위 콤마가 적용되지 않음)
 * - rows 배열 방어 처리 유지
 */
const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toLocaleString();
};

export default function MetricDataGrid({ rows = [], onRowClick }) {
  const list = Array.isArray(rows) ? rows : [];

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
          {list.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)} className="clickable">
              <td className="dim">{row.category}</td>
              <td><code>{row.indicatorCode}</code></td>
              <td className="font-medium">{row.title}</td>
              <td>{row.facility}</td>
              <td className="dim">{row.year} / {row.period}</td>
              <td className="text-right font-bold">{formatValue(row.value)}</td>
              <td className="dim text-sm">{row.unit}</td>
              <td><StatusBadge status={row.status} /></td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan="8" className="empty">조회된 데이터가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
