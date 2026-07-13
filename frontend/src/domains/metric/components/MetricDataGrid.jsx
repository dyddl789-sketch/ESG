import StatusBadge from "../../../shared/components/StatusBadge";
import { categoryLabel, formatNumber } from "../../../shared/utils/esgFormat";

export default function MetricDataGrid({ rows, onRowClick }) {
  return (
    <div className="table-scroll">
      <table className="data-table metric-grid is-clickable">
        <thead>
          <tr>
            <th>No</th>
            <th>ESG 영역</th>
            <th>지표명</th>
            <th>사업장</th>
            <th>기준월</th>
            <th>실제값</th>
            <th>출처</th>
            <th>AI 분석</th>
            <th>위험</th>
            <th>승인 상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} onClick={() => onRowClick(row)}>
              <td>{index + 1}</td>
              <td><span className={`category category-${String(row.category).toLowerCase()}`}>{categoryLabel(row.category)}</span></td>
              <td><strong>{row.title}</strong><small className="cell-sub">{row.indicatorCode}</small></td>
              <td><strong>{row.facility}</strong><small className="cell-sub">{row.category === "GOVERNANCE" ? "기업·본사 기준" : "사업장 기준"}</small></td>
              <td>{row.period}</td>
              <td><strong>{row.value === null || row.value === undefined ? row.textValue || "-" : formatNumber(row.value, 2)}</strong> <small>{row.value === null || row.value === undefined ? "" : row.unit}</small></td>
              <td>{row.source || row.method || "-"}</td>
              <td><StatusBadge status={row.aiStatus} label={row.aiStatus === "COMPLETED" ? "분석 완료" : "미분석"} /></td>
              <td><StatusBadge status={row.risk} label={row.risk === "HIGH" ? "높음" : row.risk === "MEDIUM" ? "보통" : "낮음"} /></td>
              <td><StatusBadge status={row.status} /></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={10} className="empty-cell">조건에 맞는 ESG 지표가 없습니다.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
