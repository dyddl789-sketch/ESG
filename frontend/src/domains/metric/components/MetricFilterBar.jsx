import Icon from "../../../shared/components/Icon";
import Button from "../../../shared/components/Button";

export default function MetricFilterBar({ filters, facilities, onChange, onReset }) {
  return (
    <div className="filter-toolbar metric-filter-toolbar">
      <label className="search-box">
        <Icon name="search" size={18} />
        <input
          value={filters.keyword}
          onChange={(event) => onChange({ ...filters, keyword: event.target.value })}
          placeholder="지표명, 코드, 사업장, 출처 검색"
        />
      </label>

      <select
        value={filters.category}
        onChange={(event) => onChange({ ...filters, category: event.target.value })}
      >
        <option value="ALL">전체 ESG 영역</option>
        <option value="ENVIRONMENT">환경(E)</option>
        <option value="SOCIAL">사회(S)</option>
        <option value="GOVERNANCE">거버넌스(G)</option>
      </select>

      <select
        value={filters.facility}
        onChange={(event) => onChange({ ...filters, facility: event.target.value })}
      >
        <option value="ALL">전체 사업장·본사</option>
        {facilities.map((facility) => <option key={facility} value={facility}>{facility}</option>)}
      </select>

      <Button variant="outline" size="sm" onClick={onReset}>필터 초기화</Button>
      <Button variant="outline" size="sm"><Icon name="upload" size={16} /> 엑셀 업로드</Button>
      <Button variant="outline" size="sm"><Icon name="download" size={16} /> 엑셀 다운로드</Button>
    </div>
  );
}
