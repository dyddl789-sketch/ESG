import { useMemo } from "react";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";

const number = (value, digits = 0) => Number(value || 0).toLocaleString("ko-KR", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

export default function GovernanceDataPage() {
  const {
    db,
    generateGovernanceSource,
    collectGovernanceData,
    analyzeGovernanceDocument,
    confirmGovernanceAi,
  } = useDemoData();

  const collection = db.governanceCollection;
  const isProcessing = collection.jobStatus === "PROCESSING";
  const completed = db.governanceSources.filter((item) => item.collectionStatus === "SUCCESS");
  const collectionRate = Math.round((completed.length / db.governanceSources.length) * 100);
  const values = useMemo(() => {
    const totalSeats = db.boardMeetings.reduce((sum, item) => sum + item.totalDirectors, 0);
    const attended = db.boardMeetings.reduce((sum, item) => sum + item.attendedDirectors, 0);
    return {
      attendanceRate: totalSeats ? (attended / totalSeats) * 100 : 0,
      outsideRate: (db.governanceSummary.outsideDirectors / db.governanceSummary.totalDirectors) * 100,
      ethicsRate: (db.governanceSummary.ethicsCompleted / db.governanceSummary.ethicsTarget) * 100,
    };
  }, [db.boardMeetings, db.governanceSummary]);

  const sourceColumns = [
    { key: "name", label: "수집 항목" },
    { key: "sourceSystem", label: "원천 시스템" },
    { key: "recordCount", label: "원천 건수", render: (value) => number(value) },
    { key: "sourceStatus", label: "원천 데이터", render: (value) => <StatusBadge status={value} label={value === "READY" ? "생성 완료" : "미생성"} /> },
    { key: "collectionStatus", label: "수집 상태", render: (value) => <StatusBadge status={value} /> },
    { key: "collectedAt", label: "수집 시각" },
  ];

  const meetingColumns = [
    { key: "date", label: "회의일" },
    { key: "evidence", label: "회의록" },
    { key: "totalDirectors", label: "전체 이사", render: (value) => `${value}명` },
    { key: "attendedDirectors", label: "참석 이사", render: (value) => `${value}명` },
    { key: "agendaCount", label: "안건", render: (value) => `${value}건` },
    { key: "id", label: "회의별 참석률", render: (_, row) => `${number((row.attendedDirectors / row.totalDirectors) * 100, 1)}%` },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "거버넌스 데이터"]}
        eyebrow="GOVERNANCE DATA PIPELINE"
        title="거버넌스 데이터·이사회 AI 분석"
        description="그룹웨어와 교육 시스템 데이터를 수집하고 회의록 AI 분석 결과를 담당자가 검증합니다."
      />

      <section className="domain-control-panel governance-panel">
        <div>
          <span className="control-kicker">{collection.basePeriod} 거버넌스</span>
          <h2>본사 중심의 이사회·윤리 데이터를 관리합니다.</h2>
          <p>이사회 참석률, 사외이사 비율, 윤리교육 이수율을 검증·승인 흐름으로 연결합니다.</p>
          <div className="schedule-pills">
            <span>자동 실행 <b>{collection.schedule}</b></span>
            <span>수집 항목 <b>{db.governanceSources.length}개</b></span>
            <span>대시보드 캐시 <b>{collection.cacheStatus}</b></span>
          </div>
          <div className="ems-actions">
            <Button variant="light" onClick={generateGovernanceSource} disabled={isProcessing}>거버넌스 원천 생성</Button>
            <Button onClick={collectGovernanceData} disabled={isProcessing || !collection.sourceGenerated}>
              {isProcessing ? `${collection.currentSource || "원천"} 수집 중` : "거버넌스 즉시 수집"}
            </Button>
          </div>
        </div>
        <div className="redis-lock-card">
          <div className="redis-lock-head"><span className={`lock-dot ${collection.redisLock.active ? "active" : ""}`} /><div><b>Redis 수집 락</b><small>그룹웨어 수집 중복 실행 방지</small></div></div>
          <code>{collection.redisLock.key}</code>
          <div className="lock-meta"><span>상태</span><b>{collection.redisLock.active ? "LOCKED" : "UNLOCKED"}</b></div>
          <div className="lock-meta"><span>진행률</span><b>{collection.progress}%</b></div>
          <div className="lock-meta"><span>수집률</span><b>{collectionRate}%</b></div>
        </div>
      </section>

      <div className="summary-grid three">
        <article className="collection-stat"><span>이사회 참석률</span><strong>{number(values.attendanceRate, 1)}%</strong><small>전체 참석 가능 인원 기준</small></article>
        <article className="collection-stat"><span>사외이사 비율</span><strong>{number(values.outsideRate, 1)}%</strong><small>{db.governanceSummary.outsideDirectors}/{db.governanceSummary.totalDirectors}명</small></article>
        <article className="collection-stat"><span>윤리교육 이수율</span><strong>{number(values.ethicsRate, 1)}%</strong><small>{db.governanceSummary.ethicsCompleted}/{db.governanceSummary.ethicsTarget}명</small></article>
      </div>

      <Card title="거버넌스 원천 수집 현황" description="거버넌스는 모든 사업장이 아니라 본사 그룹웨어·임원·교육 데이터를 중심으로 수집합니다." action={<StatusBadge status={collectionRate === 100 ? "COMPLETED" : "INCOMPLETE"} />}>
        <DataTable rows={db.governanceSources} columns={sourceColumns} />
      </Card>

      <div className="two-cols governance-ai-layout">
        <Card title="이사회 회의록 AI 분석" description="회의 일자·참석자·안건을 추출하되 담당자가 확인해야 지표에 반영됩니다.">
          <div className="document-ai-card">
            <div className="document-file"><span>PDF</span><div><b>{db.governanceDocument.filename}</b><small>분석 상태: {db.governanceDocument.analysisStatus}</small></div></div>
            <div className="ai-job-box compact">
              <div><span className={`lock-dot ${collection.aiJob.active ? "active" : ""}`} /><b>{collection.aiJob.message}</b></div>
              <code>{collection.aiJob.key}</code>
              <div className="progress-track"><i style={{ width: `${collection.aiJob.progress}%` }} /></div>
            </div>
            <div className="card-actions">
              <Button variant="outline" disabled={collection.aiJob.active || db.governanceDocument.analysisStatus === "COMPLETED"} onClick={analyzeGovernanceDocument}>AI 분석 실행</Button>
              <Button disabled={!db.governanceDocument.extracted || db.governanceDocument.confirmed} onClick={confirmGovernanceAi}>담당자 확인·반영</Button>
            </div>
          </div>
        </Card>
        <Card title="AI 추출 결과" description="Redis에는 진행 상태만 저장하고 확정 결과는 PostgreSQL에 보관합니다.">
          {!db.governanceDocument.extracted ? (
            <div className="empty-state"><strong>분석 대기</strong><p>회의록 AI 분석을 실행하면 추출값이 표시됩니다.</p></div>
          ) : (
            <div className="detail-grid three">
              <div><span>회의일</span><strong>{db.governanceDocument.extracted.meetingDate}</strong></div>
              <div><span>전체 이사</span><strong>{db.governanceDocument.extracted.totalDirectors}명</strong></div>
              <div><span>참석 이사</span><strong>{db.governanceDocument.extracted.attendedDirectors}명</strong></div>
              <div><span>안건 수</span><strong>{db.governanceDocument.extracted.agendaCount}건</strong></div>
              <div><span>회의 참석률</span><strong>{db.governanceDocument.extracted.attendanceRate}%</strong></div>
              <div><span>AI 신뢰도</span><strong>{db.governanceDocument.extracted.confidence}%</strong></div>
            </div>
          )}
        </Card>
      </div>

      <Card title="분기 이사회 현황" description="회의별 참석 정보를 합산해 분기 이사회 참석률을 계산합니다.">
        <DataTable rows={db.boardMeetings} columns={meetingColumns} />
      </Card>
    </div>
  );
}
