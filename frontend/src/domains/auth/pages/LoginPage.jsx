import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getApiErrorMessage, getAuthConfig } from "../api/authApi";

const DEMO_ACCOUNTS = [
  ["시스템 총괄 관리자", "admin@ecoflow.co.kr"],
  ["기업 ESG 관리자", "manager@ecoflow.co.kr"],
  ["일반 사용자", "external@example.com"],
];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("manager@ecoflow.co.kr");
  const [password, setPassword] = useState("Demo!1234");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(() =>
    searchParams.get("oauthError")
      ? "카카오 로그인에 실패했습니다. 카카오 앱 설정과 동의 항목을 확인해 주세요."
      : "",
  );
  const [kakaoEnabled, setKakaoEnabled] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getAuthConfig()
      .then((config) => setKakaoEnabled(Boolean(config?.kakaoLoginEnabled)))
      .catch(() => setKakaoEnabled(true));

  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);
    try {
      const home = await login({ email, password });
      navigate(home, { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "로그인에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const startKakaoLogin = () => {
    if (!kakaoEnabled) {
      setErrorMessage("백엔드에 KAKAO_CLIENT_ID를 설정한 뒤 카카오 로그인을 사용할 수 있습니다.");
      return;
    }
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? "http://localhost:8080" : window.location.origin);
    window.location.assign(`${backendUrl}/oauth2/authorization/kakao`);
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <div>
          <span className="brand-mark large">E</span>
          <small>EcoFlow ESG Platform</small>
          <h1>신뢰할 수 있는 ESG 데이터를<br />하나의 플랫폼에서</h1>
          <p>환경·사회·거버넌스 데이터를 수집하고 검토·승인한 뒤 권한에 맞는 대시보드와 보고서로 연결합니다.</p>
          <ul className="auth-feature-list">
            <li>JWT Access Token + Redis Refresh Token</li>
            <li>시스템 관리자·기업 ESG 관리자·일반 사용자 권한 분리</li>
            <li>카카오 소셜 로그인과 안전한 토큰 재발급</li>
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card auth-card" onSubmit={submit}>
          <span className="eyebrow">SECURE LOGIN</span>
          <h2>플랫폼 로그인</h2>
          <p>등록된 이메일과 비밀번호를 입력하세요. 권한은 서버에서 자동으로 확인합니다.</p>

          {errorMessage && <div className="auth-alert error" role="alert">{errorMessage}</div>}

          <label className="field">
            <span>이메일</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
            />
          </label>

          <label className="field">
            <span>비밀번호</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
            />
          </label>

          <button className="btn btn-primary btn-lg full" type="submit" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </button>

          <div className="auth-divider"><span>또는</span></div>

          <button className="kakao-login-btn" type="button" onClick={startKakaoLogin}>
            <span className="kakao-bubble">●</span>
            카카오로 로그인
          </button>

          <div className="auth-footer">
            <span>계정이 없나요?</span>
            <Link to="/signup">회원가입</Link>
          </div>

          <div className="demo-account-box">
            <strong>시연 계정</strong>
            <span>비밀번호: Demo!1234</span>
            <div>
              {DEMO_ACCOUNTS.map(([label, account]) => (
                <button key={account} type="button" onClick={() => { setEmail(account); setPassword("Demo!1234"); }}>
                  <b>{label}</b><small>{account}</small>
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
