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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const applySession = useCallback((session) => {
    tokenStorage.setAccessToken(session?.accessToken);
    setUser(session?.user || null);
    return session?.user ? ROLE_HOME[session.user.role] : "/login";
  }, []);

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) setUser(currentUser);
      } catch {
        if (mounted) {
          tokenStorage.clear();
          setUser(null);
        }
      } finally {
        if (mounted) setInitializing(false);
      }
    };

    const handleExpired = () => {
      tokenStorage.clear();
      setUser(null);
    };

    const handleTokenRefreshed = (event) => {
      if (event.detail?.user) setUser(event.detail.user);
    };

    window.addEventListener("auth:expired", handleExpired);
    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    restore();

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
