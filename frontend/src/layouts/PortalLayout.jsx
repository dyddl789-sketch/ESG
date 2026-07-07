import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";

export default function PortalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="portal"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} /><TopHeader collapsed={collapsed} /><main className={`content ${collapsed ? "wide" : ""}`}><Outlet /></main></div>;
}
