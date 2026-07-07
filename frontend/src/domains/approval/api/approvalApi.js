import apiClient from "../../../shared/api/apiClient";
export const approvalApi={list:()=>apiClient.get("/approvals"),approve:(id)=>apiClient.patch(`/approvals/${id}/approve`),reject:(id,data)=>apiClient.patch(`/approvals/${id}/reject`,data)};
