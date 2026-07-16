import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const metricApi = {
  list: async (params) => unwrap(await apiClient.get("/esg/metrics", { params })),
  detail: async (id) => unwrap(await apiClient.get(`/esg/metrics/${id}`)),
  create: async (data) => unwrap(await apiClient.post("/esg/metrics", data)),
  getIndicators: async () => unwrap(await apiClient.get("/esg/metrics/indicators")),
  update: async (id, data) => unwrap(await apiClient.put(`/esg/metrics/${id}`, data)),
  remove: async (id) => unwrap(await apiClient.delete(`/esg/metrics/${id}`)),
  requestApproval: async (id) => unwrap(await apiClient.patch(`/esg/metrics/${id}/request-approval`)),
  requestApprovalBatch: async (period, category) => unwrap(await apiClient.patch(
    "/esg/metrics/batch/request-approval",
    null,
    { params: { period, ...(category ? { category } : {}) } },
  )),
};
