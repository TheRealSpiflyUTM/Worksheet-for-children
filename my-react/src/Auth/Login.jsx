import { usePlatform } from "../platform/PlatformState.js";
import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.js";
import AuthShell from "./AuthShell.jsx";
import "./Auth.css";

const Login = () => {
  const { t } = usePlatform();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  async function handleLogin() {
    if (isSubmitting) return;
    if (!email.trim()) {
      setError(t("Enter your email address."));
      return;
    }
    if (!password) {
      setError(t("Enter your password."));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const user = await login(email, password);
      window.dispatchEvent(new Event("session-updated"));

      const pendingCode = sessionStorage.getItem("pending-worksheet-code");
      if (pendingCode && user.role === "USER") {
        navigate("/assignments?join=1");
        return;
      }

      if (user.role === "TEACHER") {
        navigate("/sheets");
      } else {
        navigate("/home");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title={t("Log in")}>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleLogin();
        }}
      >
        <label className="auth-field" htmlFor="login-email">
          {t("Email")}
        </label>
        <Input
          id="login-email"
          type="email"
          placeholder={t("Email")}
          value={email}
          maxLength={254}
          autoComplete="email"
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className="auth-field" htmlFor="login-password">
          {t("Password")}
        </label>
        <Input.Password
          id="login-password"
          placeholder={t("Password")}
          value={password}
          maxLength={60}
          autoComplete="current-password"
          disabled={isSubmitting}
          onChange={(event) => setPassword(event.target.value)}
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible,
          }}
          className="password-input"
        />

        <Button
          type="primary"
          htmlType="submit"
          className="enter-button"
          loading={isSubmitting}
        >
          {t("Log in")}{" "}
        </Button>

        {error && <Alert type="error" title={t(error)} showIcon />}
      </form>
    </AuthShell>
  );
};

export default Login;
