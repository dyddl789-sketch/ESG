import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data;

const esgDataApi = {
  getEnvironment: async (params) => unwrap(await apiClient.get("/esg/environment", { params })),
  getSocial: async (params) => unwrap(await apiClient.get("/esg/social", { params })),
  getGovernance: async (params) => unwrap(await apiClient.get("/esg/governance", { params })),
  reflect: async (domain, period, facilityId) => unwrap(await apiClient.post(`/esg/${domain}/reflect`, null, {
    params: { period, ...(facilityId ? { facilityId } : {}) },
  })),
  getFacilityDetail: async (facilityId, period) => unwrap(await apiClient.get(`/esg/facilities/${facilityId}`, {
    params: period ? { period } : undefined,
  })),
  getRuns: async (params) => unwrap(await apiClient.get("/esg/collection-runs", { params })),
  getRawData: async (params) => unwrap(await apiClient.get("/esg/raw-data", { params })),
};

export default esgDataApi;
