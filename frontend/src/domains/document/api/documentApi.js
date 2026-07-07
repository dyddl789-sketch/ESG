import apiClient from "../../../shared/api/apiClient";
export const documentApi={analyze:(formData)=>apiClient.post("/documents/analyze",formData,{headers:{"Content-Type":"multipart/form-data"}})};
