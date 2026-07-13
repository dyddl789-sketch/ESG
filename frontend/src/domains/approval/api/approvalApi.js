import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data;

const approvalApi = {
  list: async (params) => unwrap(await apiClient.get("/approvals", { params })),
  approve: async (id) => unwrap(await apiClient.patch(`/approvals/${id}/approve`)),
  reject: async (id, reason) => unwrap(await apiClient.patch(`/approvals/${id}/reject`, { reason })),
  approveBatch: async (period, category) => unwrap(await apiClient.patch("/approvals/batch/approve", null, {
    params: { period, ...(category ? { category } : {}) },
  })),
};

export default approvalApi;
