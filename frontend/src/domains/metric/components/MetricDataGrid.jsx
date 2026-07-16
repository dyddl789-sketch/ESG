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
            <th>등록값</th>
            <th>증빙</th>
            <th>담당자</th>
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
              <td>{row.evidence ? "PDF 등록" : "미등록"}</td>
              <td>{row.assignee || "-"}</td>
              <td><StatusBadge status={row.status} /></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={9} className="empty-cell">조건에 맞는 ESG 데이터가 없습니다.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
