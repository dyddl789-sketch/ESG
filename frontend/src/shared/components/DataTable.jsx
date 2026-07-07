export default function DataTable({ columns, rows, rowKey = "id", onRowClick, emptyText = "데이터가 없습니다." }) {
  return (
    <div className="table-scroll">
      <table className={`data-table ${onRowClick ? "is-clickable" : ""}`}>
        <thead><tr>{columns.map((column) => <th key={column.key} style={column.width ? { width: column.width } : undefined}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row[rowKey]} onClick={() => onRowClick?.(row)}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row[column.key], row) : row[column.key]}</td>)}</tr>)}
          {rows.length === 0 && <tr><td colSpan={columns.length} className="empty-cell">{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
