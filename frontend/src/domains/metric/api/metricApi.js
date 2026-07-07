import apiClient from "../../../shared/api/apiClient";
export const metricApi={list:(params)=>apiClient.get("/esg/metrics",{params}),detail:(id)=>apiClient.get(`/esg/metrics/${id}`),update:(id,data)=>apiClient.put(`/esg/metrics/${id}`,data),requestApproval:(id)=>apiClient.patch(`/esg/metrics/${id}/request-approval`)};
