import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data;

export const metricApi = {
  list: async (params) => unwrap(await apiClient.get("/esg/metrics", { params })),
  detail: async (id) => unwrap(await apiClient.get(`/esg/metrics/${id}`)),
  analyze: async (id) => unwrap(await apiClient.post(`/esg/metrics/${id}/ai-analysis`)),
  requestApproval: async (id) => unwrap(await apiClient.patch(`/esg/metrics/${id}/request-approval`)),
  analyzeBatch: async (period, category) => unwrap(await apiClient.post("/esg/metrics/batch/ai-analysis", null, {
    params: { period, ...(category ? { category } : {}) },
  })),
  requestApprovalBatch: async (period, category) => unwrap(await apiClient.patch("/esg/metrics/batch/request-approval", null, {
    params: { period, ...(category ? { category } : {}) },
  })),
};
