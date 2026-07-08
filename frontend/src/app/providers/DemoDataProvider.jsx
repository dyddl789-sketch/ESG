/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import Swal from "sweetalert2";
import { initialDb } from "../../mocks/db";

const DemoDataContext = createContext(null);
const clone = (value) => JSON.parse(JSON.stringify(value));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nowText = () => new Date().toLocaleString("ko-KR", { hour12: false });
const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

function appendMonth(metrics, code, value) {
  const previous = [...metrics].reverse().find((item) => item.indicatorCode === code && Array.isArray(item.months));
  return [...(previous?.months ?? []).slice(-5), value];
}

function upsertMetric(metrics, payload, at) {
  const index = metrics.findIndex((item) => item.indicatorCode === payload.indicatorCode && item.period === payload.period);
  const historyEntry = { at, user: "시스템", action: "자동 수집", comment: `${payload.source} 데이터 정규화 및 지표 계산` };
  if (index >= 0) {
    return metrics.map((item, itemIndex) => itemIndex === index
      ? { ...item, ...payload, history: [...(item.history ?? []), historyEntry] }
      : item);
  }
  const nextId = Math.max(0, ...metrics.map((item) => Number(item.id) || 0)) + 1;
  return [...metrics, {
    id: nextId,
    year: 2026,
    facility: "전체",
    status: "DRAFT",
    evidence: null,
    risk: "정상",
    assignee: "김ESG",
    aiFinding: "수집 결과를 검토한 뒤 승인 요청할 수 있습니다.",
    history: [historyEntry],
    ...payload,
  }];
}

function calculateEms(workplaces) {
  const completed = workplaces.filter((item) => item.collectionStatus === "SUCCESS");
  const usage = completed.reduce((sum, item) => sum + item.usage, 0);
  const production = completed.reduce((sum, item) => sum + item.production, 0);
  const emission = completed.reduce((sum, item) => sum + item.emission, 0);
  return { completed, usage, production, emission: round(emission), intensity: production ? round(usage / production, 1) : 0 };
}

function calculateSocial(workplaces) {
  const completed = workplaces.filter((item) => item.collectionStatus === "SUCCESS");
  const totals = completed.reduce((acc, item) => ({
    avgEmployees: acc.avgEmployees + item.avgEmployees,
    exits: acc.exits + item.exits,
    totalHours: acc.totalHours + item.totalHours,
    incidents: acc.incidents + item.incidents,
    trainingTarget: acc.trainingTarget + item.trainingTarget,
    trainingCompleted: acc.trainingCompleted + item.trainingCompleted,
    hazardsTotal: acc.hazardsTotal + item.hazardsTotal,
    hazardsCompleted: acc.hazardsCompleted + item.hazardsCompleted,
  }), { avgEmployees: 0, exits: 0, totalHours: 0, incidents: 0, trainingTarget: 0, trainingCompleted: 0, hazardsTotal: 0, hazardsCompleted: 0 });
  return {
    completed,
    ...totals,
    injuryRate: totals.totalHours ? round((totals.incidents / totals.totalHours) * 200000, 2) : 0,
    trainingRate: totals.trainingTarget ? round((totals.trainingCompleted / totals.trainingTarget) * 100, 1) : 0,
    hazardRate: totals.hazardsTotal ? round((totals.hazardsCompleted / totals.hazardsTotal) * 100, 1) : 0,
    turnoverRate: totals.avgEmployees ? round((totals.exits / totals.avgEmployees) * 100, 1) : 0,
  };
}

function calculateGovernance(db) {
  const totalSeats = db.boardMeetings.reduce((sum, item) => sum + item.totalDirectors, 0);
  const attended = db.boardMeetings.reduce((sum, item) => sum + item.attendedDirectors, 0);
  const { totalDirectors, outsideDirectors, ethicsTarget, ethicsCompleted } = db.governanceSummary;
  return {
    attendanceRate: totalSeats ? round((attended / totalSeats) * 100, 1) : 0,
    outsideRate: totalDirectors ? round((outsideDirectors / totalDirectors) * 100, 1) : 0,
    ethicsRate: ethicsTarget ? round((ethicsCompleted / ethicsTarget) * 100, 1) : 0,
  };
}

function applyEmsMetrics(current, at) {
  const result = calculateEms(current.emsWorkplaces);
  let metrics = upsertMetric(current.metrics, {
    category: "ENVIRONMENT", subCategory: "에너지", indicatorCode: "E-POWER-001", title: "전력 사용량",
    period: current.emsCollection.basePeriod, value: result.usage, unit: "kWh", source: "EMS", method: "API",
    status: "DRAFT", months: appendMonth(current.metrics, "E-POWER-001", result.usage),
    aiFinding: `전체 ${result.completed.length}개 사업장의 전력 사용량을 합산했습니다.`,
  }, at);
  metrics = upsertMetric(metrics, {
    category: "ENVIRONMENT", subCategory: "온실가스", indicatorCode: "E-SCOPE2-002", title: "Scope 2 배출량",
    period: current.emsCollection.basePeriod, value: result.emission, unit: "tCO₂eq", source: "EMS", method: "CALCULATION",
    status: "DRAFT", months: appendMonth(current.metrics, "E-SCOPE2-002", result.emission),
    aiFinding: `전력배출계수 0.0004594 tCO₂eq/kWh를 적용했습니다.`,
  }, at);
  return metrics;
}

function applySocialMetrics(current, at) {
  const result = calculateSocial(current.socialWorkplaces);
  const common = { category: "SOCIAL", facility: "전체", period: current.socialCollection.basePeriod, status: "DRAFT" };
  let metrics = upsertMetric(current.metrics, {
    ...common, subCategory: "산업안전", indicatorCode: "S-SAFE-001", title: "산업재해율", value: result.injuryRate,
    unit: "건/20만시간", source: "안전 시스템", method: "CALCULATION", months: appendMonth(current.metrics, "S-SAFE-001", result.injuryRate),
    aiFinding: `산업재해 ${result.incidents}건과 총 근로시간 ${result.totalHours.toLocaleString()}시간을 기준으로 계산했습니다.`,
  }, at);
  metrics = upsertMetric(metrics, {
    ...common, subCategory: "교육", indicatorCode: "S-TRAIN-002", title: "안전교육 이수율", value: result.trainingRate,
    unit: "%", source: "교육 시스템", method: "CALCULATION", months: appendMonth(current.metrics, "S-TRAIN-002", result.trainingRate),
    aiFinding: `교육 대상 ${result.trainingTarget}명 중 ${result.trainingCompleted}명이 이수했습니다.`,
  }, at);
  metrics = upsertMetric(metrics, {
    ...common, subCategory: "위험관리", indicatorCode: "S-RISK-003", title: "위험요인 개선 조치율", value: result.hazardRate,
    unit: "%", source: "안전 시스템", method: "CALCULATION", months: appendMonth(current.metrics, "S-RISK-003", result.hazardRate),
    aiFinding: `위험요인 ${result.hazardsTotal}건 중 ${result.hazardsCompleted}건의 조치가 완료되었습니다.`,
  }, at);
  metrics = upsertMetric(metrics, {
    ...common, subCategory: "고용", indicatorCode: "S-TURN-004", title: "퇴사율", value: result.turnoverRate,
    unit: "%", source: "인사 시스템", method: "CALCULATION", months: appendMonth(current.metrics, "S-TURN-004", result.turnoverRate),
    aiFinding: `평균 재직자 ${result.avgEmployees}명 대비 퇴사자 ${result.exits}명 기준입니다.`,
  }, at);
  return metrics;
}

function applyGovernanceMetrics(current, at) {
  const result = calculateGovernance(current);
  const common = { category: "GOVERNANCE", facility: "본사", period: current.governanceCollection.basePeriod, status: "DRAFT" };
  let metrics = upsertMetric(current.metrics, {
    ...common, subCategory: "이사회", indicatorCode: "G-BOARD-001", title: "이사회 참석률", value: result.attendanceRate,
    unit: "%", source: "그룹웨어", method: "DOCUMENT_AI", months: appendMonth(current.metrics, "G-BOARD-001", result.attendanceRate),
    aiFinding: `이사회 회의 ${current.boardMeetings.length}건의 전체 참석 가능 인원 대비 실제 참석 인원으로 계산했습니다.`,
  }, at);
  metrics = upsertMetric(metrics, {
    ...common, subCategory: "이사회", indicatorCode: "G-OUTSIDE-002", title: "사외이사 비율", value: result.outsideRate,
    unit: "%", source: "그룹웨어", method: "API", months: appendMonth(current.metrics, "G-OUTSIDE-002", result.outsideRate),
    aiFinding: `전체 이사 ${current.governanceSummary.totalDirectors}명 중 사외이사 ${current.governanceSummary.outsideDirectors}명입니다.`,
  }, at);
  metrics = upsertMetric(metrics, {
    ...common, subCategory: "윤리", indicatorCode: "G-ETHICS-003", title: "윤리교육 이수율", value: result.ethicsRate,
    unit: "%", source: "교육 시스템", method: "CALCULATION", months: appendMonth(current.metrics, "G-ETHICS-003", result.ethicsRate),
    aiFinding: `대상 ${current.governanceSummary.ethicsTarget}명 중 ${current.governanceSummary.ethicsCompleted}명이 이수했습니다.`,
  }, at);
  return metrics;
}

export function DemoDataProvider({ children }) {
  const [db, setDb] = useState(() => clone(initialDb));

  const updateMetric = (metricId, patch, historyEntry) => {
    setDb((current) => ({
      ...current,
      metrics: current.metrics.map((metric) => metric.id !== Number(metricId) ? metric : {
        ...metric, ...patch, history: historyEntry ? [...metric.history, historyEntry] : metric.history,
      }),
    }));
  };

  const requestApproval = async (metricId, user) => {
    updateMetric(metricId, { status: "PENDING" }, { at: nowText(), user: user.name, action: "승인 요청", comment: "관리자 최종 검토 요청" });
    await Swal.fire({ icon: "success", title: "승인 요청 완료", text: "시스템 총괄 관리자에게 전달되었습니다.", confirmButtonColor: "#1f6b46" });
  };

  const decideApproval = async (metricId, decision, user) => {
    let comment = "최종 승인";
    if (decision === "REJECTED") {
      const result = await Swal.fire({
        title: "반려 사유 입력", input: "textarea", inputPlaceholder: "보완이 필요한 내용을 입력하세요.", showCancelButton: true,
        confirmButtonText: "반려", cancelButtonText: "취소", confirmButtonColor: "#d14b43", inputValidator: (value) => !value?.trim() && "반려 사유를 입력하세요.",
      });
      if (!result.isConfirmed) return false;
      comment = result.value;
    }
    updateMetric(metricId, { status: decision }, { at: nowText(), user: user.name, action: decision === "APPROVED" ? "최종 승인" : "반려", comment });
    await Swal.fire({ icon: decision === "APPROVED" ? "success" : "info", title: decision === "APPROVED" ? "승인 완료" : "반려 완료", confirmButtonColor: "#1f6b46" });
    return true;
  };

  const runIntegration = async (sourceId = "ALL") => {
    const now = nowText();
    setDb((current) => ({
      ...current,
      integrations: current.integrations.map((source) => sourceId === "ALL" || source.id === sourceId
        ? { ...source, lastRun: now, status: "NORMAL", errorCount: 0, newCount: source.newCount + 1 }
        : source),
    }));
    await Swal.fire({ icon: "success", title: "연동 완료", text: "원천 데이터 수집·기본 검증·정규화를 완료했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const generateEmsSource = async () => {
    if (db.emsCollection.jobStatus === "PROCESSING") return;
    const generatedAt = nowText();
    setDb((current) => ({
      ...current,
      emsCollection: { ...current.emsCollection, sourceGenerated: true, sourceGeneratedAt: generatedAt, jobStatus: "READY", progress: 0, currentWorkplace: null, cacheStatus: "STALE" },
      emsWorkplaces: current.emsWorkplaces.map((item) => ({ ...item, sourceStatus: "READY", collectionStatus: "WAITING", collectedAt: "-", errorMessage: "" })),
    }));
    await Swal.fire({ icon: "success", title: "가상 EMS 원천 데이터 생성", html: "4개 사업장의 <b>2026년 6월 전력 사용량</b>을 생성했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const collectAllEms = async () => {
    if (!db.emsCollection.sourceGenerated) {
      await Swal.fire({ icon: "warning", title: "원천 데이터가 없습니다", text: "먼저 시연용 EMS 원천 데이터를 생성해주세요.", confirmButtonColor: "#1f6b46" });
      return;
    }
    if (db.emsCollection.redisLock.active || db.emsCollection.jobStatus === "PROCESSING") {
      await Swal.fire({ icon: "info", title: "이미 수집 작업이 진행 중입니다", text: db.emsCollection.redisLock.key, confirmButtonColor: "#1f6b46" });
      return;
    }
    const startedAt = nowText();
    setDb((current) => ({ ...current,
      emsCollection: { ...current.emsCollection, jobStatus: "PROCESSING", progress: 0, currentWorkplace: null, redisLock: { ...current.emsCollection.redisLock, active: true, ttl: 300 }, cacheStatus: "STALE" },
      emsWorkplaces: current.emsWorkplaces.map((item) => ({ ...item, collectionStatus: "WAITING", collectedAt: "-" })),
    }));

    for (let index = 0; index < db.emsWorkplaces.length; index += 1) {
      const workplace = db.emsWorkplaces[index];
      setDb((current) => ({ ...current,
        emsCollection: { ...current.emsCollection, currentWorkplace: workplace.facilityName, progress: Math.round((index / db.emsWorkplaces.length) * 100) },
        emsWorkplaces: current.emsWorkplaces.map((item) => item.id === workplace.id ? { ...item, collectionStatus: "PROCESSING" } : item),
      }));
      await delay(360);
      const collectedAt = nowText();
      setDb((current) => ({ ...current,
        emsCollection: { ...current.emsCollection, progress: Math.round(((index + 1) / db.emsWorkplaces.length) * 100) },
        emsWorkplaces: current.emsWorkplaces.map((item) => item.id === workplace.id ? { ...item, collectionStatus: "SUCCESS", collectedAt } : item),
      }));
    }

    const completedAt = nowText();
    setDb((current) => ({ ...current,
      emsCollection: { ...current.emsCollection, jobStatus: "COMPLETED", progress: 100, currentWorkplace: null, redisLock: { ...current.emsCollection.redisLock, active: false, ttl: 0 }, cacheStatus: "REFRESHED" },
      integrations: current.integrations.map((source) => source.id === "EMS" ? { ...source, lastRun: completedAt, newCount: current.emsWorkplaces.length, errorCount: 0, status: "NORMAL" } : source),
      metrics: applyEmsMetrics(current, completedAt),
      integrationRuns: [{ id: `RUN-${Date.now()}`, source: "EMS", basePeriod: current.emsCollection.basePeriod, triggerType: "MANUAL", startedAt, completedAt, total: current.emsWorkplaces.length, success: current.emsWorkplaces.length, duplicate: 0, error: 0, status: "SUCCESS" }, ...current.integrationRuns],
      auditLogs: [{ id: Date.now(), at: completedAt, user: "김ESG", action: "INTEGRATION", target: "EMS", detail: "환경 통계와 Scope 2 잠정값 즉시 갱신" }, ...current.auditLogs],
    }));
    await Swal.fire({ icon: "success", title: "EMS 수집·통계 갱신 완료", html: "환경 대시보드와 실적 통계에 <b>전력 사용량·Scope 2 잠정값</b>을 반영했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const retryEmsWorkplace = async (workplaceId) => {
    if (!db.emsCollection.sourceGenerated) return;
    const workplace = db.emsWorkplaces.find((item) => item.id === workplaceId);
    if (!workplace) return;
    setDb((current) => ({ ...current, emsWorkplaces: current.emsWorkplaces.map((item) => item.id === workplaceId ? { ...item, collectionStatus: "PROCESSING" } : item) }));
    await delay(450);
    const collectedAt = nowText();
    setDb((current) => {
      const emsWorkplaces = current.emsWorkplaces.map((item) => item.id === workplaceId ? { ...item, collectionStatus: "SUCCESS", collectedAt, errorMessage: "" } : item);
      const next = { ...current, emsWorkplaces };
      return { ...next, emsCollection: { ...current.emsCollection, cacheStatus: "REFRESHED" }, metrics: applyEmsMetrics(next, collectedAt) };
    });
    await Swal.fire({ icon: "success", title: `${workplace.facilityName} 재수집 완료`, text: "환경 통계도 함께 재계산했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const generateSocialSource = async () => {
    if (db.socialCollection.jobStatus === "PROCESSING") return;
    const generatedAt = nowText();
    setDb((current) => ({ ...current,
      socialCollection: { ...current.socialCollection, sourceGenerated: true, sourceGeneratedAt: generatedAt, jobStatus: "READY", progress: 0, currentWorkplace: null, cacheStatus: "STALE" },
      socialWorkplaces: current.socialWorkplaces.map((item) => ({ ...item, sourceStatus: "READY", collectionStatus: "WAITING", collectedAt: "-" })),
    }));
    await Swal.fire({ icon: "success", title: "사회 원천 데이터 생성", text: "인사·안전·교육 시스템의 월간 가상 데이터를 생성했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const collectSocialData = async () => {
    if (!db.socialCollection.sourceGenerated) {
      await Swal.fire({ icon: "warning", title: "원천 데이터가 없습니다", text: "먼저 사회 원천 데이터를 생성해주세요.", confirmButtonColor: "#1f6b46" });
      return;
    }
    if (db.socialCollection.redisLock.active || db.socialCollection.jobStatus === "PROCESSING") {
      await Swal.fire({ icon: "info", title: "이미 사회 데이터 수집 중입니다", text: db.socialCollection.redisLock.key, confirmButtonColor: "#1f6b46" });
      return;
    }
    const startedAt = nowText();
    setDb((current) => ({ ...current,
      socialCollection: { ...current.socialCollection, jobStatus: "PROCESSING", progress: 0, redisLock: { ...current.socialCollection.redisLock, active: true, ttl: 300 }, cacheStatus: "STALE" },
      socialWorkplaces: current.socialWorkplaces.map((item) => ({ ...item, collectionStatus: "WAITING", collectedAt: "-" })),
    }));
    for (let index = 0; index < db.socialWorkplaces.length; index += 1) {
      const workplace = db.socialWorkplaces[index];
      setDb((current) => ({ ...current,
        socialCollection: { ...current.socialCollection, currentWorkplace: workplace.facilityName, progress: Math.round((index / db.socialWorkplaces.length) * 100) },
        socialWorkplaces: current.socialWorkplaces.map((item) => item.id === workplace.id ? { ...item, collectionStatus: "PROCESSING" } : item),
      }));
      await delay(350);
      const collectedAt = nowText();
      setDb((current) => ({ ...current,
        socialCollection: { ...current.socialCollection, progress: Math.round(((index + 1) / db.socialWorkplaces.length) * 100) },
        socialWorkplaces: current.socialWorkplaces.map((item) => item.id === workplace.id ? { ...item, collectionStatus: "SUCCESS", collectedAt } : item),
      }));
    }
    const completedAt = nowText();
    setDb((current) => ({ ...current,
      socialCollection: { ...current.socialCollection, jobStatus: "COMPLETED", progress: 100, currentWorkplace: null, redisLock: { ...current.socialCollection.redisLock, active: false, ttl: 0 }, cacheStatus: "REFRESHED" },
      integrations: current.integrations.map((source) => ["HR", "SAFETY", "TRAINING"].includes(source.id) ? { ...source, lastRun: completedAt, newCount: current.socialWorkplaces.length, errorCount: 0, status: "NORMAL" } : source),
      metrics: applySocialMetrics(current, completedAt),
      integrationRuns: [{ id: `RUN-${Date.now()}`, source: "SOCIAL", basePeriod: current.socialCollection.basePeriod, triggerType: "MANUAL", startedAt, completedAt, total: current.socialWorkplaces.length, success: current.socialWorkplaces.length, duplicate: 0, error: 0, status: "SUCCESS" }, ...current.integrationRuns],
      auditLogs: [{ id: Date.now(), at: completedAt, user: "김ESG", action: "INTEGRATION", target: "SOCIAL", detail: "사회 핵심 지표 4개 잠정 통계 갱신" }, ...current.auditLogs],
    }));
    await Swal.fire({ icon: "success", title: "사회 데이터 수집 완료", text: "산업재해율·안전교육 이수율·위험요인 개선 조치율·퇴사율을 갱신했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const analyzeRisk = async (riskId) => {
    const risk = db.riskItems.find((item) => item.id === riskId);
    if (!risk || db.socialCollection.aiJob.active) return;
    const key = `job:ai-risk-analysis:${riskId}`;
    setDb((current) => ({ ...current,
      socialCollection: { ...current.socialCollection, aiJob: { active: true, key, progress: 20, message: "위험 유형을 분류하고 있습니다." } },
      riskItems: current.riskItems.map((item) => item.id === riskId ? { ...item, analysisStatus: "PROCESSING" } : item),
    }));
    await delay(480);
    setDb((current) => ({ ...current, socialCollection: { ...current.socialCollection, aiJob: { active: true, key, progress: 70, message: "위험도와 개선 조치를 생성하고 있습니다." } } }));
    await delay(520);
    const result = riskId === 501
      ? { aiType: "미끄러짐·넘어짐", aiSeverity: "높음", aiAction: "누출 원인 점검, 바닥 즉시 청소, 미끄럼 방지 매트와 경고 표지를 설치하세요." }
      : { aiType: "충돌·넘어짐", aiSeverity: "중간", aiAction: "적재 구역 경계를 재설정하고 보행 통로를 확보한 뒤 일일 점검표에 반영하세요." };
    const completedAt = nowText();
    setDb((current) => ({ ...current,
      socialCollection: { ...current.socialCollection, aiJob: { active: false, key, progress: 100, message: "AI 분석 완료" } },
      riskItems: current.riskItems.map((item) => item.id === riskId ? { ...item, ...result, analysisStatus: "COMPLETED" } : item),
      auditLogs: [{ id: Date.now(), at: completedAt, user: "김ESG", action: "AI_ANALYSIS", target: `RISK-${riskId}`, detail: "위험 유형·위험도·개선 조치 초안 생성" }, ...current.auditLogs],
    }));
  };

  const confirmRiskAnalysis = async (riskId) => {
    setDb((current) => ({ ...current, riskItems: current.riskItems.map((item) => item.id === riskId ? { ...item, confirmed: true } : item) }));
    await Swal.fire({ icon: "success", title: "AI 분석 결과 확정", text: "담당자가 검토한 개선 조치로 저장했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const completeRiskAction = async (riskId) => {
    const risk = db.riskItems.find((item) => item.id === riskId);
    if (!risk?.confirmed) {
      await Swal.fire({ icon: "warning", title: "담당자 확인이 필요합니다", text: "AI 분석 결과를 먼저 검토·확정해주세요.", confirmButtonColor: "#1f6b46" });
      return;
    }
    if (risk.actionStatus === "COMPLETED") return;
    const completedAt = nowText();
    setDb((current) => {
      const socialWorkplaces = current.socialWorkplaces.map((item) => item.facilityName === risk.facilityName
        ? { ...item, hazardsCompleted: Math.min(item.hazardsTotal, item.hazardsCompleted + 1) }
        : item);
      const next = { ...current, socialWorkplaces };
      return {
        ...next,
        riskItems: current.riskItems.map((item) => item.id === riskId ? { ...item, actionStatus: "COMPLETED" } : item),
        socialCollection: { ...current.socialCollection, cacheStatus: "REFRESHED" },
        metrics: current.socialCollection.jobStatus === "COMPLETED" ? applySocialMetrics(next, completedAt) : current.metrics,
      };
    });
    await Swal.fire({ icon: "success", title: "개선 조치 완료", text: "위험요인 개선 조치율과 사회 통계를 다시 계산했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const generateGovernanceSource = async () => {
    if (db.governanceCollection.jobStatus === "PROCESSING") return;
    const generatedAt = nowText();
    setDb((current) => ({ ...current,
      governanceCollection: { ...current.governanceCollection, sourceGenerated: true, sourceGeneratedAt: generatedAt, jobStatus: "READY", progress: 0, currentSource: null, cacheStatus: "STALE" },
      governanceSources: current.governanceSources.map((item) => ({ ...item, sourceStatus: "READY", collectionStatus: "WAITING", collectedAt: "-" })),
    }));
    await Swal.fire({ icon: "success", title: "거버넌스 원천 데이터 생성", text: "그룹웨어·임원명부·윤리교육 데이터를 준비했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const collectGovernanceData = async () => {
    if (!db.governanceCollection.sourceGenerated) {
      await Swal.fire({ icon: "warning", title: "원천 데이터가 없습니다", text: "먼저 거버넌스 원천 데이터를 생성해주세요.", confirmButtonColor: "#1f6b46" });
      return;
    }
    if (db.governanceCollection.redisLock.active || db.governanceCollection.jobStatus === "PROCESSING") {
      await Swal.fire({ icon: "info", title: "이미 거버넌스 데이터 수집 중입니다", text: db.governanceCollection.redisLock.key, confirmButtonColor: "#1f6b46" });
      return;
    }
    const startedAt = nowText();
    setDb((current) => ({ ...current,
      governanceCollection: { ...current.governanceCollection, jobStatus: "PROCESSING", progress: 0, redisLock: { ...current.governanceCollection.redisLock, active: true, ttl: 300 }, cacheStatus: "STALE" },
      governanceSources: current.governanceSources.map((item) => ({ ...item, collectionStatus: "WAITING", collectedAt: "-" })),
    }));
    for (let index = 0; index < db.governanceSources.length; index += 1) {
      const source = db.governanceSources[index];
      setDb((current) => ({ ...current,
        governanceCollection: { ...current.governanceCollection, currentSource: source.name, progress: Math.round((index / db.governanceSources.length) * 100) },
        governanceSources: current.governanceSources.map((item) => item.id === source.id ? { ...item, collectionStatus: "PROCESSING" } : item),
      }));
      await delay(400);
      const collectedAt = nowText();
      setDb((current) => ({ ...current,
        governanceCollection: { ...current.governanceCollection, progress: Math.round(((index + 1) / db.governanceSources.length) * 100) },
        governanceSources: current.governanceSources.map((item) => item.id === source.id ? { ...item, collectionStatus: "SUCCESS", collectedAt } : item),
      }));
    }
    const completedAt = nowText();
    setDb((current) => ({ ...current,
      governanceCollection: { ...current.governanceCollection, jobStatus: "COMPLETED", progress: 100, currentSource: null, redisLock: { ...current.governanceCollection.redisLock, active: false, ttl: 0 }, cacheStatus: "REFRESHED" },
      integrations: current.integrations.map((source) => ["GROUPWARE", "TRAINING"].includes(source.id) ? { ...source, lastRun: completedAt, newCount: source.id === "GROUPWARE" ? 11 : 1250, errorCount: 0, status: "NORMAL" } : source),
      metrics: applyGovernanceMetrics(current, completedAt),
      integrationRuns: [{ id: `RUN-${Date.now()}`, source: "GOVERNANCE", basePeriod: current.governanceCollection.basePeriod, triggerType: "MANUAL", startedAt, completedAt, total: current.governanceSources.length, success: current.governanceSources.length, duplicate: 0, error: 0, status: "SUCCESS" }, ...current.integrationRuns],
      auditLogs: [{ id: Date.now(), at: completedAt, user: "김ESG", action: "INTEGRATION", target: "GOVERNANCE", detail: "거버넌스 핵심 지표 3개 잠정 통계 갱신" }, ...current.auditLogs],
    }));
    await Swal.fire({ icon: "success", title: "거버넌스 데이터 수집 완료", text: "이사회 참석률·사외이사 비율·윤리교육 이수율을 갱신했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const analyzeGovernanceDocument = async () => {
    if (db.governanceCollection.aiJob.active) return;
    const key = db.governanceCollection.aiJob.key;
    setDb((current) => ({ ...current,
      governanceCollection: { ...current.governanceCollection, aiJob: { active: true, key, progress: 20, message: "회의 일자와 참석자 정보를 추출하고 있습니다." } },
      governanceDocument: { ...current.governanceDocument, analysisStatus: "PROCESSING" },
    }));
    await delay(520);
    setDb((current) => ({ ...current, governanceCollection: { ...current.governanceCollection, aiJob: { active: true, key, progress: 70, message: "안건과 참석률을 검증하고 있습니다." } } }));
    await delay(520);
    setDb((current) => ({ ...current,
      governanceCollection: { ...current.governanceCollection, aiJob: { active: false, key, progress: 100, message: "AI 분석 완료" } },
      governanceDocument: { ...current.governanceDocument, analysisStatus: "COMPLETED", extracted: { meetingDate: "2026-06-24", totalDirectors: 8, attendedDirectors: 6, agendaCount: 5, attendanceRate: 75, confidence: 96 } },
    }));
  };

  const confirmGovernanceAi = async () => {
    if (!db.governanceDocument.extracted) return;
    const completedAt = nowText();
    setDb((current) => {
      const extracted = current.governanceDocument.extracted;
      const boardMeetings = current.boardMeetings.map((item) => item.id === 603 ? { ...item, date: extracted.meetingDate, totalDirectors: extracted.totalDirectors, attendedDirectors: extracted.attendedDirectors, agendaCount: extracted.agendaCount } : item);
      const next = { ...current, boardMeetings };
      return { ...next,
        governanceDocument: { ...current.governanceDocument, confirmed: true },
        governanceCollection: { ...current.governanceCollection, cacheStatus: "REFRESHED" },
        metrics: current.governanceCollection.jobStatus === "COMPLETED" ? applyGovernanceMetrics(next, completedAt) : current.metrics,
        auditLogs: [{ id: Date.now(), at: completedAt, user: "김ESG", action: "AI_CONFIRM", target: "BOARD-MINUTES", detail: "이사회 회의록 AI 추출 결과 담당자 확정" }, ...current.auditLogs],
      };
    });
    await Swal.fire({ icon: "success", title: "AI 추출 결과 확정", text: "확인된 회의 정보와 이사회 참석률을 반영했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const syncExternalBenchmark = async () => {
    const syncedAt = nowText();
    setDb((current) => ({ ...current, externalBenchmarks: { ...current.externalBenchmarks, lastSyncedAt: syncedAt, status: "SYNCED" } }));
    await Swal.fire({ icon: "success", title: "외부 비교 데이터 동기화 완료", text: "업종별 전력 및 온실가스 비교 기준을 갱신했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const resetDemo = () => setDb(clone(initialDb));

  const value = {
    db,
    updateMetric,
    requestApproval,
    decideApproval,
    runIntegration,
    generateEmsSource,
    collectAllEms,
    retryEmsWorkplace,
    generateSocialSource,
    collectSocialData,
    analyzeRisk,
    confirmRiskAnalysis,
    completeRiskAction,
    generateGovernanceSource,
    collectGovernanceData,
    analyzeGovernanceDocument,
    confirmGovernanceAi,
    syncExternalBenchmark,
    resetDemo,
  };

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const value = useContext(DemoDataContext);
  if (!value) throw new Error("useDemoData must be used inside DemoDataProvider");
  return value;
}
