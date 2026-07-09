import apiClient from "../../../shared/api/apiClient";

const dataOf = (response) => response.data?.data;

export async function loginRequest(payload) {
  return dataOf(await apiClient.post("/auth/login", payload));
}

export async function signupRequest(payload) {
  return dataOf(await apiClient.post("/auth/signup", payload));
}

export async function checkLoginId(loginId) {
  return dataOf(await apiClient.get("/auth/check-login-id", { params: { loginId } }));
}

export async function checkEmail(email) {
  return dataOf(await apiClient.get("/auth/check-email", { params: { email } }));
}

export async function checkPhone(phoneNumber) {
  return dataOf(await apiClient.get("/auth/check-phone", { params: { phoneNumber } }));
}

export async function sendEmailVerification(email) {
  return dataOf(await apiClient.post("/auth/email-verifications/send", { email }));
}

export async function confirmEmailVerification(email, code) {
  return dataOf(await apiClient.post("/auth/email-verifications/confirm", { email, code }));
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
