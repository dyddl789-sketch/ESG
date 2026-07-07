export function getDashboardSummary(db) {
  const pending = db.metrics.filter((item) => item.status === "PENDING").length;
  const approved = db.metrics.filter((item) => item.status === "APPROVED").length;
  const rejected = db.metrics.filter((item) => item.status === "REJECTED").length;
  return { overallScore: 82, eScore: 85, sScore: 78, gScore: 83, collectionRate: 94, approvalRate: Math.round((approved / db.metrics.length) * 100), pending, approved, rejected };
}
