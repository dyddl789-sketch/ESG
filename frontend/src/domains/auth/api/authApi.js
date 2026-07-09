import apiClient from "../../../shared/api/apiClient";

const dataOf = (response) => response.data?.data;

export async function loginRequest(payload) {
  return dataOf(await apiClient.post("/auth/login", payload));
}

export async function signupRequest(payload) {
  return dataOf(await apiClient.post("/auth/signup", payload));
}

export async function getCurrentUser() {
  return dataOf(await apiClient.get("/auth/me"));
}

export async function logoutRequest() {
  await apiClient.post("/auth/logout");
}

export async function exchangeOAuthCode(code) {
  return dataOf(await apiClient.post("/auth/oauth/exchange", { code }));
}

export async function getAuthConfig() {
  return dataOf(await apiClient.get("/auth/config"));
}

export function getApiErrorMessage(error, fallback = "요청 처리 중 오류가 발생했습니다.") {
  return error.response?.data?.error?.message || error.message || fallback;
}
