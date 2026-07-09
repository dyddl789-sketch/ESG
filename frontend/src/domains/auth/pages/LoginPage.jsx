import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getApiErrorMessage, getAuthConfig } from "../api/authApi";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
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
      const home = await login({ loginId: loginId.trim(), password });
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
    const backendUrl = import.meta.env.VITE_BACKEND_URL
      || (import.meta.env.DEV ? "http://localhost:8080" : window.location.origin);
    window.location.assign(`${backendUrl}/oauth2/authorization/kakao`);
  };

  return (
    <main className="auth-screen auth-login-screen">
      <div className="auth-background-orb orb-one" />
      <div className="auth-background-orb orb-two" />

      <section className="auth-shell auth-login-shell">
        <Link className="auth-brand" to="/">
          <span className="auth-brand-mark">E</span>
          <span><strong>EcoFlow ESG</strong><small>Data Management Platform</small></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-kicker">SECURE SIGN IN</span>
          <h1>ESG 플랫폼 로그인</h1>
          <p>발급받은 로그인 아이디와 비밀번호를 입력해 주세요.</p>
        </div>

        {errorMessage && <div className="auth-alert error" role="alert">{errorMessage}</div>}

        <form className="modern-auth-form" onSubmit={submit}>
          <label className="modern-field">
            <span>로그인 아이디</span>
            <input
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
              placeholder="로그인 아이디 입력"
              minLength={4}
              maxLength={20}
              required
              autoFocus
            />
          </label>

          <label className="modern-field">
            <span>비밀번호</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호 입력"
              required
            />
          </label>

          <button className="modern-primary-button" type="submit" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="auth-divider"><span>또는</span></div>

        <button className="kakao-login-btn modern-kakao" type="button" onClick={startKakaoLogin}>
          <span className="kakao-bubble">●</span>
          카카오로 로그인
        </button>

        <div className="auth-footer modern-auth-footer">
          <span>아직 계정이 없나요?</span>
          <Link to="/signup">회원가입</Link>
        </div>

        <p className="auth-security-note">JWT 인증과 Redis 세션 관리로 안전하게 보호됩니다.</p>
      </section>
    </main>
  );
}
