import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  checkEmail,
  checkLoginId,
  checkPhone,
  confirmEmailVerification,
  getApiErrorMessage,
  sendEmailVerification,
} from "../api/authApi";

const EMAIL_DOMAINS = ["gmail.com", "naver.com", "daum.net", "kakao.com", "custom"];
const PHONE_PREFIXES = ["010", "011", "016", "017", "018", "019"];
const EMPTY_CHECK = { status: "idle", message: "" };

const INITIAL_FORM = {
  loginId: "",
  name: "",
  password: "",
  passwordConfirm: "",
  emailLocal: "",
  emailDomain: "gmail.com",
  customEmailDomain: "",
  emailCode: "",
  phonePrefix: "010",
  phoneMiddle: "",
  phoneLast: "",
  termsAccepted: false,
};

export default function SignupPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [checks, setChecks] = useState({
    loginId: EMPTY_CHECK,
    email: EMPTY_CHECK,
    phone: EMPTY_CHECK,
  });
  const [emailVerification, setEmailVerification] = useState({
    sent: false,
    verified: false,
    message: "",
  });
  const [loadingAction, setLoadingAction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const email = useMemo(() => {
    const domain = form.emailDomain === "custom" ? form.customEmailDomain.trim() : form.emailDomain;
    return form.emailLocal.trim() && domain ? `${form.emailLocal.trim()}@${domain}` : "";
  }, [form.customEmailDomain, form.emailDomain, form.emailLocal]);

  const phoneNumber = useMemo(() => {
    if (!form.phoneMiddle || !form.phoneLast) return "";
    return `${form.phonePrefix}-${form.phoneMiddle}-${form.phoneLast}`;
  }, [form.phoneLast, form.phoneMiddle, form.phonePrefix]);

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetCheck = (key) => {
    setChecks((current) => ({ ...current, [key]: EMPTY_CHECK }));
  };

  const updateLoginId = (value) => {
    updateForm("loginId", value.replace(/[^A-Za-z0-9_]/g, ""));
    resetCheck("loginId");
  };

  const updateEmailPart = (name, value) => {
    updateForm(name, value.replace(/\s/g, ""));
    resetCheck("email");
    setEmailVerification({ sent: false, verified: false, message: "" });
  };

  const updatePhonePart = (name, value, maxLength) => {
    updateForm(name, value.replace(/\D/g, "").slice(0, maxLength));
    resetCheck("phone");
  };

  const runCheck = async (key, action, value, invalidMessage) => {
    setErrorMessage("");
    if (!value) {
      setChecks((current) => ({
        ...current,
        [key]: { status: "error", message: invalidMessage },
      }));
      return false;
    }

    setLoadingAction(key);
    try {
      const result = await action(value);
      setChecks((current) => ({
        ...current,
        [key]: {
          status: result?.available ? "success" : "error",
          message: result?.message || "확인 결과를 불러왔습니다.",
        },
      }));
      return Boolean(result?.available);
    } catch (error) {
      const message = getApiErrorMessage(error, "중복 확인에 실패했습니다.");
      setChecks((current) => ({ ...current, [key]: { status: "error", message } }));
      return false;
    } finally {
      setLoadingAction("");
    }
  };

  const handleLoginIdCheck = () => {
    const valid = /^[A-Za-z][A-Za-z0-9_]{3,19}$/.test(form.loginId);
    if (!valid) {
      setChecks((current) => ({
        ...current,
        loginId: {
          status: "error",
          message: "영문으로 시작하는 4~20자의 영문, 숫자, 밑줄을 사용해 주세요.",
        },
      }));
      return;
    }
    runCheck("loginId", checkLoginId, form.loginId, "로그인 아이디를 입력해 주세요.");
  };

  const handleEmailCheck = () => {
    runCheck("email", checkEmail, email, "이메일을 완성해 주세요.");
  };

  const handlePhoneCheck = () => {
    const valid = /^01[016789]-\d{3,4}-\d{4}$/.test(phoneNumber);
    if (!valid) {
      setChecks((current) => ({
        ...current,
        phone: { status: "error", message: "휴대폰 번호를 정확히 입력해 주세요." },
      }));
      return;
    }
    runCheck("phone", checkPhone, phoneNumber, "휴대폰 번호를 입력해 주세요.");
  };

  const handleSendEmailCode = async () => {
    setErrorMessage("");
    let emailAvailable = checks.email.status === "success";
    if (!emailAvailable) {
      emailAvailable = await runCheck("email", checkEmail, email, "이메일을 완성해 주세요.");
    }
    if (!emailAvailable) return;

    setLoadingAction("email-send");
    try {
      const result = await sendEmailVerification(email);
      setEmailVerification({
        sent: true,
        verified: false,
        message: result?.message || "인증번호를 발송했습니다.",
      });
    } catch (error) {
      setEmailVerification({
        sent: false,
        verified: false,
        message: getApiErrorMessage(error, "인증번호 발송에 실패했습니다."),
      });
    } finally {
      setLoadingAction("");
    }
  };

  const handleConfirmEmailCode = async () => {
    if (!/^\d{6}$/.test(form.emailCode)) {
      setEmailVerification((current) => ({
        ...current,
        verified: false,
        message: "인증번호 숫자 6자리를 입력해 주세요.",
      }));
      return;
    }

    setLoadingAction("email-confirm");
    try {
      const result = await confirmEmailVerification(email, form.emailCode);
      setEmailVerification({
        sent: true,
        verified: Boolean(result?.verified),
        message: result?.message || "이메일 인증이 완료되었습니다.",
      });
    } catch (error) {
      setEmailVerification((current) => ({
        ...current,
        verified: false,
        message: getApiErrorMessage(error, "인증번호 확인에 실패했습니다."),
      }));
    } finally {
      setLoadingAction("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (checks.loginId.status !== "success") {
      setErrorMessage("로그인 아이디 중복 확인을 완료해 주세요.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (checks.email.status !== "success" || !emailVerification.verified) {
      setErrorMessage("이메일 중복 확인과 인증을 완료해 주세요.");
      return;
    }
    if (checks.phone.status !== "success") {
      setErrorMessage("휴대폰 번호 중복 확인을 완료해 주세요.");
      return;
    }
    if (!form.termsAccepted) {
      setErrorMessage("서비스 이용약관과 개인정보 처리방침에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const home = await signup({
        loginId: form.loginId,
        name: form.name,
        email,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        phoneNumber,
        termsAccepted: form.termsAccepted,
      });
      navigate(home, { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "회원가입에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const CheckMessage = ({ state }) => (
    state.message ? <small className={`field-message ${state.status}`}>{state.message}</small> : null
  );

  return (
    <main className="auth-screen auth-signup-screen">
      <div className="auth-background-orb orb-one" />
      <div className="auth-background-orb orb-two" />

      <section className="auth-shell auth-signup-shell">
        <div className="signup-shell-header">
          <Link className="auth-brand" to="/">
            <span className="auth-brand-mark">E</span>
            <span><strong>EcoFlow ESG</strong><small>Data Management Platform</small></span>
          </Link>
          <div className="auth-heading compact">
            <span className="auth-kicker">CREATE ACCOUNT</span>
            <h1>회원가입</h1>
            <p>중복 확인과 이메일 인증을 완료한 뒤 계정을 생성해 주세요.</p>
          </div>
        </div>

        {errorMessage && <div className="auth-alert error" role="alert">{errorMessage}</div>}

        <form className="modern-auth-form signup-form" onSubmit={submit}>
          <div className="signup-section">
            <h2>기본 정보</h2>
            <div className="signup-grid two">
              <div className="field-block">
                <label className="modern-field">
                  <span>로그인 아이디</span>
                  <div className="field-with-button">
                    <input
                      value={form.loginId}
                      onChange={(event) => updateLoginId(event.target.value)}
                      placeholder="영문 시작, 4~20자"
                      minLength={4}
                      maxLength={20}
                      required
                    />
                    <button type="button" onClick={handleLoginIdCheck} disabled={loadingAction === "loginId"}>
                      {loadingAction === "loginId" ? "확인 중" : "중복 확인"}
                    </button>
                  </div>
                </label>
                <CheckMessage state={checks.loginId} />
              </div>

              <label className="modern-field">
                <span>이름</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="이름 입력"
                  maxLength={100}
                  required
                />
              </label>
            </div>
          </div>

          <div className="signup-section">
            <h2>비밀번호</h2>
            <div className="signup-grid two">
              <label className="modern-field">
                <span>비밀번호</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  placeholder="영문·숫자·특수문자 포함 8자 이상"
                  minLength={8}
                  maxLength={64}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="modern-field">
                <span>비밀번호 확인</span>
                <input
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(event) => updateForm("passwordConfirm", event.target.value)}
                  placeholder="비밀번호 다시 입력"
                  minLength={8}
                  maxLength={64}
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>
            <small className={`password-match ${form.passwordConfirm && form.password !== form.passwordConfirm ? "error" : ""}`}>
              {form.passwordConfirm && form.password !== form.passwordConfirm
                ? "비밀번호가 일치하지 않습니다."
                : "비밀번호는 영문, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다."}
            </small>
          </div>

          <div className="signup-section">
            <h2>이메일 인증</h2>
            <div className="field-block">
              <label className="modern-field">
                <span>이메일</span>
                <div className="email-composer">
                  <input
                    value={form.emailLocal}
                    onChange={(event) => updateEmailPart("emailLocal", event.target.value)}
                    placeholder="이메일 아이디"
                    required
                  />
                  <b>@</b>
                  {form.emailDomain === "custom" ? (
                    <input
                      value={form.customEmailDomain}
                      onChange={(event) => updateEmailPart("customEmailDomain", event.target.value)}
                      placeholder="도메인 직접 입력"
                      required
                    />
                  ) : (
                    <input value={form.emailDomain} readOnly />
                  )}
                  <select
                    value={form.emailDomain}
                    onChange={(event) => updateEmailPart("emailDomain", event.target.value)}
                  >
                    {EMAIL_DOMAINS.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain === "custom" ? "직접 입력" : domain}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleEmailCheck} disabled={loadingAction === "email"}>
                    {loadingAction === "email" ? "확인 중" : "중복 확인"}
                  </button>
                </div>
              </label>
              <CheckMessage state={checks.email} />
            </div>

            <div className="verification-row">
              <button
                className="verification-send"
                type="button"
                onClick={handleSendEmailCode}
                disabled={loadingAction === "email-send" || emailVerification.verified}
              >
                {loadingAction === "email-send" ? "발송 중..." : emailVerification.sent ? "인증번호 재발송" : "인증번호 발송"}
              </button>
              <input
                value={form.emailCode}
                onChange={(event) => updateForm("emailCode", event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="인증번호 6자리"
                inputMode="numeric"
                maxLength={6}
                disabled={!emailVerification.sent || emailVerification.verified}
              />
              <button
                type="button"
                onClick={handleConfirmEmailCode}
                disabled={!emailVerification.sent || emailVerification.verified || loadingAction === "email-confirm"}
              >
                {emailVerification.verified ? "인증 완료" : loadingAction === "email-confirm" ? "확인 중" : "인증 확인"}
              </button>
            </div>
            {emailVerification.message && (
              <small className={`field-message ${emailVerification.verified ? "success" : "info"}`}>
                {emailVerification.message}
              </small>
            )}
          </div>

          <div className="signup-section">
            <h2>휴대폰 번호</h2>
            <div className="field-block">
              <label className="modern-field">
                <span>휴대폰 번호</span>
                <div className="phone-composer">
                  <select
                    value={form.phonePrefix}
                    onChange={(event) => {
                      updateForm("phonePrefix", event.target.value);
                      resetCheck("phone");
                    }}
                  >
                    {PHONE_PREFIXES.map((prefix) => <option key={prefix}>{prefix}</option>)}
                  </select>
                  <b>-</b>
                  <input
                    value={form.phoneMiddle}
                    onChange={(event) => updatePhonePart("phoneMiddle", event.target.value, 4)}
                    inputMode="numeric"
                    minLength={3}
                    maxLength={4}
                    required
                  />
                  <b>-</b>
                  <input
                    value={form.phoneLast}
                    onChange={(event) => updatePhonePart("phoneLast", event.target.value, 4)}
                    inputMode="numeric"
                    minLength={4}
                    maxLength={4}
                    required
                  />
                  <button type="button" onClick={handlePhoneCheck} disabled={loadingAction === "phone"}>
                    {loadingAction === "phone" ? "확인 중" : "중복 확인"}
                  </button>
                </div>
              </label>
              <CheckMessage state={checks.phone} />
            </div>
          </div>

          <label className="terms-check modern-terms">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(event) => updateForm("termsAccepted", event.target.checked)}
            />
            <span>서비스 이용약관과 개인정보 처리방침에 동의합니다.</span>
          </label>

          <button className="modern-primary-button" type="submit" disabled={submitting}>
            {submitting ? "계정 생성 중..." : "회원가입 완료"}
          </button>
        </form>

        <div className="auth-footer modern-auth-footer">
          <span>이미 계정이 있나요?</span>
          <Link to="/login">로그인</Link>
        </div>
      </section>
    </main>
  );
}
