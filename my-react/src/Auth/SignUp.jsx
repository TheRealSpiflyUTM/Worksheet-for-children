import { usePlatform } from "../platform/PlatformState.js";
import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import AuthShell from "./AuthShell.jsx";
import "./Auth.css";

const SignUp = () => {
  const { t } = usePlatform();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSighnUp() {
    if (isSubmitting) return;
    if (password !== confirmPassword) {
      setError(t("Passwords do not match."));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Request": "1",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "TEACHER",
        }),
      });

      window.dispatchEvent(new Event("session-updated"));
      navigate("/account");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell signup title={t("Account for teachers")}>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSighnUp();
        }}
      >
        <label className="auth-field" htmlFor="signup-email">
          {t("Email")}
        </label>
        <Input
          id="signup-email"
          autoComplete="email"
          disabled={isSubmitting}
          type="email"
          placeholder={t("Email")}
          value={email}
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className="auth-field" htmlFor="signup-name">
          {t("Username")}
        </label>
        <Input
          id="signup-name"
          autoComplete="nickname"
          disabled={isSubmitting}
          placeholder={t("Username")}
          maxLength={25}
          value={name}
          className="username-input"
          onChange={(e) => setName(e.target.value)}
        />

        <label className="auth-field" htmlFor="signup-password">
          {t("Password")}
        </label>
        <Input.Password
          id="signup-password"
          autoComplete="new-password"
          disabled={isSubmitting}
          placeholder={t("Password")}
          maxLength={25}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible,
          }}
          className="password-input"
        />

        <label className="auth-field" htmlFor="signup-confirm">
          {t("Confirm password")}
        </label>
        <Input.Password
          id="signup-confirm"
          autoComplete="new-password"
          disabled={isSubmitting}
          placeholder={t("Confirm password")}
          maxLength={25}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          visibilityToggle={{
            visible: confirmPasswordVisible,
            onVisibleChange: setConfirmPasswordVisible,
          }}
          className="password-input"
        />

        <Button
          type="primary"
          htmlType="submit"
          className="enter-button"
          loading={isSubmitting}
        >
          {t("Create account")}
        </Button>

        {error && <Alert type="error" title={t(error)} showIcon />}
      </form>
    </AuthShell>
  );
};

export default SignUp;
