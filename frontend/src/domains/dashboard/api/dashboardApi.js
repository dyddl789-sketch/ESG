const rate = (rows = []) => rows.length ? Math.round((rows.filter((item) => item.collectionStatus === "SUCCESS").length / rows.length) * 100) : 0;
const latestValue = (metrics, code, fallback = 0) => [...metrics].reverse().find((item) => item.indicatorCode === code)?.value ?? fallback;
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

export function getDashboardSummary(db) {
  const pending = db.metrics.filter((item) => item.status === "PENDING").length;
  const approved = db.metrics.filter((item) => item.status === "APPROVED").length;
  const rejected = db.metrics.filter((item) => item.status === "REJECTED").length;
  const environmentRate = rate(db.emsWorkplaces);
  const socialRate = rate(db.socialWorkplaces);
  const governanceRate = rate(db.governanceSources);

  const injuryRate = Number(latestValue(db.metrics, "S-SAFE-001", 0.22));
  const trainingRate = Number(latestValue(db.metrics, "S-TRAIN-002", 95.8));
  const hazardRate = Number(latestValue(db.metrics, "S-RISK-003", 84.6));
  const turnoverRate = Number(latestValue(db.metrics, "S-TURN-004", 1.6));
  const boardRate = Number(latestValue(db.metrics, "G-BOARD-001", 91.7));
  const outsideRate = Number(latestValue(db.metrics, "G-OUTSIDE-002", 37.5));
  const ethicsRate = Number(latestValue(db.metrics, "G-ETHICS-003", 96.4));

  const eScore = clamp(74 + environmentRate * 0.12);
  const sScore = clamp(((100 - injuryRate * 18) + trainingRate + hazardRate + (100 - turnoverRate * 5)) / 4);
  const gScore = clamp((boardRate + Math.min(100, outsideRate * 2) + ethicsRate) / 3);
  const overallScore = clamp((eScore + sScore + gScore) / 3);
  const totalCollectionRate = Math.round((environmentRate + socialRate + governanceRate) / 3);

  return {
    overallScore,
    eScore,
    sScore,
    gScore,
    collectionRate: environmentRate,
    environmentRate,
    socialRate,
    governanceRate,
    totalCollectionRate,
    approvalRate: db.metrics.length ? Math.round((approved / db.metrics.length) * 100) : 0,
    pending,
    approved,
    rejected,
  };
}
