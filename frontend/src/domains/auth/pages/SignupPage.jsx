import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { getApiErrorMessage } from "../api/authApi";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  phoneNumber: "",
  termsAccepted: false,
};

export default function SignupPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.passwordConfirm) {
      setErrorMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const home = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        termsAccepted: form.termsAccepted,
      });
      navigate(home, { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "회원가입에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-visual signup-visual">
        <div>
          <span className="brand-mark large">E</span>
          <small>EcoFlow ESG Platform</small>
          <h1>공개 ESG 정보를<br />안전하게 확인하세요</h1>
          <p>일반 회원가입 계정은 EXTERNAL_USER 권한으로 생성되며, 최종 승인된 ESG 실적과 공개 보고서를 조회할 수 있습니다.</p>
        </div>
      </section>

      <section className="login-panel signup-panel">
        <form className="login-card auth-card signup-card" onSubmit={submit}>
          <span className="eyebrow">CREATE ACCOUNT</span>
          <h2>회원가입</h2>
          <p>기업 ESG 관리자와 시스템 관리자 권한은 가입 후 관리자가 별도로 부여합니다.</p>

          {errorMessage && <div className="auth-alert error" role="alert">{errorMessage}</div>}

          <div className="auth-field-grid">
            <label className="field">
              <span>이름</span>
              <input name="name" value={form.name} onChange={change} autoComplete="name" required />
            </label>
            <label className="field">
              <span>전화번호</span>
              <input name="phoneNumber" value={form.phoneNumber} onChange={change} placeholder="010-0000-0000" autoComplete="tel" />
            </label>
          </div>

          <label className="field">
            <span>이메일</span>
            <input name="email" type="email" value={form.email} onChange={change} autoComplete="username" required />
          </label>

          <div className="auth-field-grid">
            <label className="field">
              <span>비밀번호</span>
              <input name="password" type="password" value={form.password} onChange={change} autoComplete="new-password" required />
            </label>
            <label className="field">
              <span>비밀번호 확인</span>
              <input name="passwordConfirm" type="password" value={form.passwordConfirm} onChange={change} autoComplete="new-password" required />
            </label>
          </div>
          <p className="password-hint">8~64자, 영문·숫자·특수문자를 각각 하나 이상 포함해야 합니다.</p>

          <label className="terms-check">
            <input name="termsAccepted" type="checkbox" checked={form.termsAccepted} onChange={change} />
            <span>서비스 이용약관과 개인정보 처리방침에 동의합니다.</span>
          </label>

          <button className="btn btn-primary btn-lg full" type="submit" disabled={submitting}>
            {submitting ? "계정 생성 중..." : "회원가입하고 시작"}
          </button>

          <div className="auth-footer">
            <span>이미 계정이 있나요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
