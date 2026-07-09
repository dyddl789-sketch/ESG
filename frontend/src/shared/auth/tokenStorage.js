const ACCESS_TOKEN_KEY = "esg.accessToken";

let memoryToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const tokenStorage = {
  getAccessToken() {
    return memoryToken;
  },
  setAccessToken(token) {
    memoryToken = token || null;
    if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  },
  clear() {
    memoryToken = null;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
