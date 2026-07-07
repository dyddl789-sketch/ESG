import { NavLink } from "react-router-dom";
import { NAVIGATION } from "../../app/config/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import Icon from "../../shared/components/Icon";

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const groups = NAVIGATION[user.role] ?? [];
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand-row">
        <div className="brand-mark">E</div>
        {!collapsed && <div><strong>EcoFlow ESG</strong><span>Data Platform</span></div>}
        <button type="button" className="sidebar-toggle" onClick={onToggle}><Icon name="menu" size={18} /></button>
      </div>
      <nav className="side-nav">
        {groups.map((group) => <div className="nav-group" key={group.label}>{!collapsed && <span className="nav-group-label">{group.label}</span>}{group.items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} title={item.label}><Icon name={item.icon} size={19} />{!collapsed && <span>{item.label}</span>}</NavLink>)}</div>)}
      </nav>
      <div className="side-footer">{!collapsed && <div className="goal-card"><b>2030 탄소중립 목표</b><span>기준연도 대비 35% 감축</span><div><i style={{ width: "62%" }} /></div></div>}</div>
    </aside>
  );
}
