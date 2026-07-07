import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLE_LABELS, ROLES } from "../../../app/config/roles";

export default function LoginPage() {
  const [role, setRole] = useState(ROLES.COMPANY_MANAGER);
  const [email, setEmail] = useState("manager@ecoflow.co.kr");
  const [password, setPassword] = useState("demo1234");
  const { login } = useAuth();
  const navigate = useNavigate();
  const submit = (event) => { event.preventDefault(); if (email && password) navigate(login(role)); };
  return <div className="login-page"><section className="login-visual"><div><span className="brand-mark large">E</span><small>EcoFlow ESG Platform</small><h1>역할별 ESG 업무 흐름을<br/>하나의 화면에서</h1><p>기업 ESG 관리자의 데이터 검토부터 시스템 총괄 관리자의 최종 승인, 일반 사용자의 공개 정보 조회까지 확인합니다.</p></div></section><section className="login-panel"><form className="login-card" onSubmit={submit}><span className="eyebrow">DEMO LOGIN</span><h2>플랫폼 로그인</h2><p>확인할 업무 역할을 선택하세요.</p><div className="role-cards">{Object.values(ROLES).map((item) => <button type="button" className={role === item ? "selected" : ""} key={item} onClick={() => { setRole(item); setEmail(item === ROLES.SYSTEM_ADMIN ? "admin@ecoflow.co.kr" : item === ROLES.EXTERNAL_USER ? "external@example.com" : "manager@ecoflow.co.kr"); }}><strong>{ROLE_LABELS[item]}</strong><span>{item}</span></button>)}</div><label className="field"><span>이메일</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /></label><label className="field"><span>비밀번호</span><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label><button className="btn btn-primary btn-lg full" type="submit">로그인</button></form></section></div>;
}
