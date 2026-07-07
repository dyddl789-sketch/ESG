/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import Cookies from "js-cookie";
import { ROLE_HOME, ROLE_LABELS, ROLES } from "../config/roles";

const AuthContext = createContext(null);

const DEMO_USERS = {
  [ROLES.COMPANY_MANAGER]: { id: 2, name: "김ESG", email: "manager@ecoflow.co.kr", role: ROLES.COMPANY_MANAGER, department: "지속가능경영팀" },
  [ROLES.SYSTEM_ADMIN]: { id: 1, name: "박시스템", email: "admin@ecoflow.co.kr", role: ROLES.SYSTEM_ADMIN, department: "플랫폼운영팀" },
  [ROLES.EXTERNAL_USER]: { id: 3, name: "이투자", email: "external@example.com", role: ROLES.EXTERNAL_USER, department: "일반 사용자" },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedRole = localStorage.getItem("esg-demo-role");
    return savedRole ? DEMO_USERS[savedRole] : null;
  });

  const login = (role) => {
    const nextUser = DEMO_USERS[role] ?? DEMO_USERS[ROLES.COMPANY_MANAGER];
    localStorage.setItem("esg-demo-role", nextUser.role);
    Cookies.set("demoRole", nextUser.role, { sameSite: "Lax" });
    setUser(nextUser);
    return ROLE_HOME[nextUser.role];
  };

  const logout = () => {
    localStorage.removeItem("esg-demo-role");
    Cookies.remove("demoRole");
    setUser(null);
  };

  const switchRole = (role) => login(role);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
    switchRole,
    roleLabel: user ? ROLE_LABELS[user.role] : "",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
