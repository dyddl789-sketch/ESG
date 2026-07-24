const fallbackCoordinates = {
  본사: { latitude: 35.1796, longitude: 129.0756 },
  부산공장: { latitude: 35.0951, longitude: 128.9795 },
  울산공장: { latitude: 35.5384, longitude: 129.3114 },
  창원공장: { latitude: 35.2279, longitude: 128.6811 },
};

const valueOf = (object, ...keys) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return object[key];
    }
  }
  return null;
};

export const normalizeFacility = (facility, index = 0) => {
  const name = valueOf(facility, "facilityName", "facility_name", "name") || `사업장 ${index + 1}`;
  const fallback = fallbackCoordinates[name] || Object.values(fallbackCoordinates)[index % 4];

  return {
    ...facility,
    id: Number(valueOf(facility, "id")) || index + 1,
    facilityName: name,
    facilityType: valueOf(facility, "facilityType", "facility_type") || (name === "본사" ? "HQ" : "FACTORY"),
    address: valueOf(facility, "address") || "주소 미등록",
    contractPowerKw: Number(valueOf(facility, "contractPowerKw", "contract_power_kw")) || 0,
    managerName: valueOf(facility, "managerName", "manager_name") || "담당자 미지정",
    managerPhone: valueOf(facility, "managerPhone", "manager_phone") || "",
    active: valueOf(facility, "active", "is_active") !== false,
    operationStartDate: valueOf(facility, "operationStartDate", "operation_start_date"),
    operationEndDate: valueOf(facility, "operationEndDate", "operation_end_date"),
    createdAt: valueOf(facility, "createdAt", "created_at"),
    latitude: Number(valueOf(facility, "latitude")) || fallback.latitude,
    longitude: Number(valueOf(facility, "longitude")) || fallback.longitude,
  };
};

const statusPriority = {
  ERROR: 4,
  FAILED: 4,
  REVIEW: 3,
  INCOMPLETE: 3,
  PENDING: 2,
  WAITING: 2,
  COMPLETED: 1,
  SUCCESS: 1,
  NORMAL: 1,
};

export const normalizeMapStatus = (status) => {
  if (["ERROR", "FAILED"].includes(status)) return "ERROR";
  if (["REVIEW", "INCOMPLETE", "REJECTED"].includes(status)) return "REVIEW";
  if (["PENDING", "WAITING", "PROCESSING"].includes(status)) return "PENDING";
  return "NORMAL";
};

export const createFacilitySnapshot = (facility, db) => {
  const normalized = normalizeFacility(facility);
  const environment = db.emsWorkplaces.find((item) => (
    item.facilityId === normalized.id || item.facilityName === normalized.facilityName
  ));
  const social = db.socialWorkplaces.find((item) => item.facilityName === normalized.facilityName);
  const rawData = [
    environment && {
      id: `ENV-${environment.id}`,
      domain: "환경",
      sourceSystem: "EMS",
      sourceRecordId: environment.sourceRecordId,
      basePeriod: db.emsCollection.basePeriod,
      collectedAt: environment.collectedAt,
      validationStatus: environment.collectionStatus,
      value: `${Number(environment.usage || 0).toLocaleString("ko-KR")} kWh`,
    },
    social && {
      id: `SOC-${social.id}-SAFETY`,
      domain: "사회",
      sourceSystem: "안전 시스템",
      sourceRecordId: `SAFETY-${normalized.id}-${db.socialCollection.basePeriod}`,
      basePeriod: db.socialCollection.basePeriod,
      collectedAt: social.collectedAt,
      validationStatus: social.collectionStatus,
      value: `재해 ${social.incidents}건 · 위험요인 ${social.hazardsTotal}건`,
    },
    social && {
      id: `SOC-${social.id}-HR`,
      domain: "사회",
      sourceSystem: "인사·교육 시스템",
      sourceRecordId: `HR-${normalized.id}-${db.socialCollection.basePeriod}`,
      basePeriod: db.socialCollection.basePeriod,
      collectedAt: social.collectedAt,
      validationStatus: social.collectionStatus,
      value: `재직 ${social.avgEmployees}명 · 교육 ${social.trainingCompleted}/${social.trainingTarget}명`,
    },
  ].filter(Boolean);

  const relatedRuns = db.integrationRuns.filter((run) => (
    ["EMS", "SOCIAL"].includes(run.source)
  )).slice(0, 6);

  const statuses = [environment?.collectionStatus, social?.collectionStatus].filter(Boolean);
  const highestStatus = statuses.sort((a, b) => (
    (statusPriority[b] || 0) - (statusPriority[a] || 0)
  ))[0] || "WAITING";

  return {
    facility: {
      ...normalized,
      mapStatus: normalizeMapStatus(highestStatus),
    },
    environment,
    social,
    rawData,
    relatedRuns,
    governance: db.governanceSummary,
    status: highestStatus,
  };
};

export const createFacilityMapRows = (facilities, db) => facilities.map((facility, index) => (
  createFacilitySnapshot(normalizeFacility(facility, index), db).facility
));

const parsePayload = (payload) => {
  if (!payload) {
    return {};
  }

  if (typeof payload === "object") {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return { raw: payload };
  }
};

export const mergeServerFacilitySnapshot = (fallbackSnapshot, serverDetail) => {
  if (!serverDetail) {
    return fallbackSnapshot;
  }

  const environmentSource = serverDetail.environment;
  const socialSource = serverDetail.social;
  const rawSource = serverDetail.rawData || [];
  const runSource = serverDetail.collectionRuns || [];
  const facility = normalizeFacility(serverDetail.facility || fallbackSnapshot.facility);

  const environment = environmentSource
    ? {
        ...environmentSource,
        usage: Number(environmentSource.electricityUsageKwh || 0),
        production: Number(environmentSource.productionTon || 0),
        intensity: Number(environmentSource.intensityKwhPerTon || 0),
        emissionFactor: Number(environmentSource.emissionFactor || 0),
        emission: Number(environmentSource.scope2Tco2eq || 0),
        collectionStatus: environmentSource.validationStatus || "NORMAL",
        basePeriod: environmentSource.basePeriod,
      }
    : fallbackSnapshot.environment;

  const social = socialSource
    ? {
        ...socialSource,
        avgEmployees: Number(socialSource.averageEmployees || 0),
        exits: Number(socialSource.exitCount || 0),
        totalHours: Number(socialSource.totalWorkHours || 0),
        incidents: Number(socialSource.incidentCount || 0),
        trainingTarget: Number(socialSource.trainingTargetCount || 0),
        trainingCompleted: Number(socialSource.trainingCompletedCount || 0),
        hazardsTotal: Number(socialSource.hazardTotalCount || 0),
        hazardsCompleted: Number(socialSource.hazardCompletedCount || 0),
        collectionStatus: socialSource.validationStatus || "NORMAL",
        basePeriod: socialSource.basePeriod,
      }
    : fallbackSnapshot.social;

  const rawData = rawSource.length
    ? rawSource.map((item) => {
        const payload = parsePayload(item.payload);
        const value = item.domain === "ENVIRONMENT"
          ? `${Number(payload.electricityUsageKwh || 0).toLocaleString("ko-KR")} kWh`
          : item.domain === "SOCIAL"
            ? `재해 ${payload.incidentCount || 0}건 · 교육 ${payload.trainingCompletedCount || 0}/${payload.trainingTargetCount || 0}명`
            : "본사 거버넌스 원천 데이터";

        return {
          ...item,
          domain: item.domain === "ENVIRONMENT" ? "환경" : item.domain === "SOCIAL" ? "사회" : "거버넌스",
          value,
        };
      })
    : fallbackSnapshot.rawData;

  const relatedRuns = runSource.length
    ? runSource.map((run) => ({
        ...run,
        source: run.domain,
      }))
    : fallbackSnapshot.relatedRuns;

  const statuses = [environment?.collectionStatus, social?.collectionStatus].filter(Boolean);
  const highestStatus = statuses.sort((a, b) => (
    (statusPriority[b] || 0) - (statusPriority[a] || 0)
  ))[0] || fallbackSnapshot.status;

  return {
    ...fallbackSnapshot,
    facility: {
      ...facility,
      mapStatus: normalizeMapStatus(highestStatus),
    },
    environment,
    social,
    governance: serverDetail.governance || fallbackSnapshot.governance,
    rawData,
    relatedRuns,
    status: highestStatus,
  };
};
