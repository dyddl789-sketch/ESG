import React from "react";
import StatusBadge from "../../../shared/components/StatusBadge";

/**
 * [신규 생성] PerformancePage가 import하지만 존재하지 않아 빌드가 깨지던 컴포넌트.
 * 지표별 최신 측정값과 직전 대비 증감률을 표 형태로 보여준다.
 */
const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toLocaleString();
};

// months 배열의 마지막 두 값으로 증감률(%) 계산
const calcChange = (months) => {
  if (!Array.isArray(months) || months.length < 2) return null;
  const prev = Number(months[months.length - 2]);
  const curr = Number(months[months.length - 1]);
  if (!prev || Number.isNaN(prev) || Number.isNaN(curr)) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

export default function PerformanceTable({ metrics = [] }) {
  const list = Array.isArray(metrics) ? metrics : [];

  return (
    <div className="data-grid-wrapper">
      <table className="data-grid">
        <thead>
          <tr>
            <th>분류</th>
            <th>지표명</th>
            <th>기간</th>
            <th className="text-right">최신 측정값</th>
            <th>단위</th>
            <th className="text-right">직전 대비</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {list.map((m) => {
            const change = calcChange(m.months);
            return (
              <tr key={m.id}>
                <td className="dim">{m.category}</td>
                <td className="font-medium">{m.title}</td>
                <td className="dim">{m.year} / {m.period}</td>
                <td className="text-right font-bold">{formatValue(m.value)}</td>
                <td className="dim text-sm">{m.unit}</td>
                <td className="text-right" style={{ color: change > 0 ? "#d14b43" : change < 0 ? "#1f6b46" : undefined }}>
                  {change === null ? "-" : `${change > 0 ? "▲" : change < 0 ? "▼" : ""} ${Math.abs(change).toFixed(1)}%`}
                </td>
                <td><StatusBadge status={m.status} /></td>
              </tr>
            );
          })}
          {list.length === 0 && (
            <tr>
              <td colSpan="7" className="empty">조회된 데이터가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
