/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ROLE_HOME, ROLE_LABELS } from "../config/roles";
import {
  exchangeOAuthCode,
  getCurrentUser,
  loginRequest,
  logoutRequest,
  signupRequest,
} from "../../domains/auth/api/authApi";
import { tokenStorage } from "../../shared/auth/tokenStorage";

const AuthContext = createContext(null);

// React StrictMode가 개발 환경에서 Provider를 다시 마운트해도
// 같은 /auth/me 복구 요청을 중복 실행하지 않도록 공유한다.
let restoreSessionPromise = null;

function restoreCurrentUser() {
  if (!restoreSessionPromise) {
    restoreSessionPromise = getCurrentUser().finally(() => {
      restoreSessionPromise = null;
    });
  }
  return restoreSessionPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(() => window.location.pathname !== "/oauth/callback");

  const applySession = useCallback((session) => {
    tokenStorage.setAccessToken(session?.accessToken);
    setUser(session?.user || null);
    setInitializing(false);
    return session?.user ? ROLE_HOME[session.user.role] : "/login";
  }, []);

  useEffect(() => {
    let mounted = true;
    const handleExpired = () => {
      tokenStorage.clear();
      setUser(null);
      setInitializing(false);
    };

    const handleTokenRefreshed = (event) => {
      if (event.detail?.user) setUser(event.detail.user);
    };

    window.addEventListener("auth:expired", handleExpired);
    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);

    // OAuth 콜백에서는 아직 JWT 교환 전이므로 /auth/me와 /auth/refresh를
    // 먼저 호출하지 않는다. OAuthCallbackPage의 exchange 완료를 기다린다.
    if (window.location.pathname !== "/oauth/callback") {
      restoreCurrentUser()
        .then((currentUser) => {
          if (mounted) setUser(currentUser);
        })
        .catch(() => {
          if (mounted) {
            tokenStorage.clear();
            setUser(null);
          }
        })
        .finally(() => {
          if (mounted) setInitializing(false);
        });
    }

    return () => {
      mounted = false;
      window.removeEventListener("auth:expired", handleExpired);
      window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
    };
  }, []);

  const login = useCallback(async (credentials) => applySession(await loginRequest(credentials)), [applySession]);
  const signup = useCallback(async (payload) => applySession(await signupRequest(payload)), [applySession]);
  const completeOAuthLogin = useCallback(
    async (code) => applySession(await exchangeOAuthCode(code)),
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      tokenStorage.clear();
      setUser(null);
      setInitializing(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      signup,
      completeOAuthLogin,
      logout,
      roleLabel: user ? ROLE_LABELS[user.role] : "",
    }),
    [user, initializing, login, signup, completeOAuthLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
