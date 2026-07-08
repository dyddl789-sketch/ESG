import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getApiErrorMessage } from "../api/authApi";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [message, setMessage] = useState(() =>
    code ? "카카오 계정을 확인하고 있습니다." : "카카오 로그인 인증 코드가 없습니다.",
  );
  const [failed, setFailed] = useState(() => !code);
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    if (!code) return;

    completeOAuthLogin(code)
      .then((home) => navigate(home, { replace: true }))
      .catch((error) => {
        setFailed(true);
        setMessage(getApiErrorMessage(error, "카카오 로그인 처리에 실패했습니다."));
      });
  }, [code, completeOAuthLogin, navigate]);

  return (
    <div className="oauth-callback-page">
      <div className="oauth-callback-card">
        <span className={`oauth-spinner ${failed ? "failed" : ""}`}>{failed ? "!" : "E"}</span>
        <h1>{failed ? "로그인 실패" : "로그인 처리 중"}</h1>
        <p>{message}</p>
        {failed && <Link className="btn btn-primary btn-md" to="/login">로그인 화면으로</Link>}
      </div>
    </div>
  );
}
