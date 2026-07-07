import apiClient from "../../../shared/api/apiClient";
export const reportApi={list:()=>apiClient.get("/reports"),generate:(data)=>apiClient.post("/reports/generate",data)};
