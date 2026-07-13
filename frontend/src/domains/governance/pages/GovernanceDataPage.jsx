import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import esgDataApi from "../../integration/api/esgDataApi";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";

const initialFilters = { year: 2026, month: 6, reflectionStatus: "", approvalStatus: "" };

export default function GovernanceDataPage() {
  const { user } = useAuth();
  const canManage = [ROLES.COMPANY_MANAGER, ROLES.SYSTEM_ADMIN].includes(user?.role);
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reflecting, setReflecting] = useState(false);
  const period = periodOf(filters.year, filters.month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await esgDataApi.getGovernance({
        period,
        ...(filters.reflectionStatus ? { reflectionStatus: filters.reflectionStatus } : {}),
        ...(filters.approvalStatus ? { approvalStatus: filters.approvalStatus } : {}),
      }) || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [filters.approvalStatus, filters.reflectionStatus, period]);

  useEffect(() => { load(); }, [load]);

  const current = rows[0];
  const summary = useMemo(() => ({
    meetingCount: current?.boardMeetingCount || 0,
    attendance: current?.boardAttendanceRate,
    outside: current?.outsideDirectorRate,
    ethics: current?.ethicsCompletionRate,
  }), [current]);

  const reflect = async () => {
    const result = await Swal.fire({
      title: `${period} 거버넌스 데이터 ESG 반영`,
      text: "본사·기업 기준 거버넌스 실제값을 ESG 지표로 저장합니다.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ESG 반영",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;

    setReflecting(true);
    try {
      const response = await esgDataApi.reflect("GOVERNANCE", period);
      await Swal.fire("반영 완료", `${response?.reflectedMetricCount || 0}개 거버넌스 지표가 생성되었습니다.`, "success");
      await load();
    } catch (error) {
      Swal.fire("반영 실패", apiErrorMessage(error), "error");
    } finally {
      setReflecting(false);
    }
  };

  const columns = [
    { key: "headquartersName", label: "관리 기준", render: (value) => <div><strong>{value || "기업·본사"}</strong><small className="cell-sub">기업 단위 집계</small></div> },
    { key: "boardMeetingStatus", label: "이사회", render: (value, row) => <div><StatusBadge status={value} /><small className="cell-sub">개최 {formatNumber(row.boardMeetingCount)}회</small></div> },
    { key: "boardAttendanceRate", label: "이사회 참석률", render: (value, row) => row.boardMeetingStatus === "NOT_HELD" ? "해당 월 미개최" : `${formatNumber(value, 1)}%` },
    { key: "outsideDirectorRate", label: "사외이사 비율", render: (value, row) => <div><strong>{formatNumber(value, 1)}%</strong><small className="cell-sub">{row.outsideDirectors}/{row.totalDirectors}명</small></div> },
    { key: "ethicsCompletionRate", label: "윤리교육 이수율", render: (value, row) => <div><strong>{formatNumber(value, 1)}%</strong><small className="cell-sub">{row.ethicsCompletedCount}/{row.ethicsTargetCount}명</small></div> },
    { key: "validationStatus", label: "검증", render: (value) => <StatusBadge status={value} /> },
    { key: "reflectionStatus", label: "ESG 반영", render: (value) => <StatusBadge status={value} /> },
    { key: "approvalStatus", label: "승인", render: (value) => <StatusBadge status={value} /> },
    { key: "collectedAt", label: "최근 수집", render: (value) => formatDateTime(value) },
  ];

  return (
    <div className="page-stack esg-domain-page">
      <PageHeader breadcrumbs={["데이터 관리", "거버넌스"]} eyebrow="GOVERNANCE DATA" title="거버넌스 데이터" description="본사·기업 기준으로 월별 이사회와 윤리·컴플라이언스 실제값을 관리합니다." actions={canManage ? <Button disabled={reflecting || rows.length === 0 || rows.every((row) => row.reflectionStatus === "REFLECTED")} onClick={reflect}>{reflecting ? "반영 중..." : "ESG 반영"}</Button> : null} />

      <section className="workflow-strip"><span>그룹웨어·윤리교육</span><i>→</i><strong>기업 단위 실제값 확인</strong><i>→</i><span>ESG 반영</span><i>→</i><span>AI 분석·승인</span><i>→</i><span>대시보드 확정</span></section>

      <Card className="filter-card" title="조회 조건" description="이사회 미개최 월은 참석률 0%가 아니라 미개최로 구분합니다.">
        <div className="esg-filter-grid compact">
          <label><span>기준연도</span><select value={filters.year} onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>반영 상태</span><select value={filters.reflectionStatus} onChange={(e) => setFilters({ ...filters, reflectionStatus: e.target.value })}><option value="">전체</option><option value="NOT_REFLECTED">미반영</option><option value="REFLECTED">반영 완료</option></select></label>
          <label><span>승인 상태</span><select value={filters.approvalStatus} onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}><option value="">전체</option><option value="DRAFT">검토 중</option><option value="PENDING">승인 대기</option><option value="APPROVED">승인 완료</option><option value="REJECTED">반려</option></select></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button><Button onClick={load}>검색</Button></div>
        </div>
      </Card>

      <div className="summary-card-grid four">
        <article><span>이사회 개최</span><strong>{summary.meetingCount}회</strong><small>{period} 기준</small></article>
        <article><span>이사회 참석률</span><strong>{current?.boardMeetingStatus === "NOT_HELD" ? "미개최" : `${formatNumber(summary.attendance, 1)}%`}</strong><small>개최 좌석 기준</small></article>
        <article><span>사외이사 비율</span><strong>{formatNumber(summary.outside, 1)}%</strong><small>이사회 구성</small></article>
        <article><span>윤리교육 이수율</span><strong>{formatNumber(summary.ethics, 1)}%</strong><small>교육 대상자 대비</small></article>
      </div>

      <Card title={`${period} 거버넌스 실제값`} description="지표 평가는 기업·본사 단위로 관리되며 최종 승인 후 대시보드에 확정 반영됩니다.">
        {loading ? <div className="data-loading">거버넌스 데이터를 불러오는 중입니다.</div> : <DataTable rows={rows} columns={columns} emptyText="조건에 맞는 거버넌스 데이터가 없습니다." />}
      </Card>
    </div>
  );
}
