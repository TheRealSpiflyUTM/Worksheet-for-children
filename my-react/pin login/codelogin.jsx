import React from "react";
import { Input, Button } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { platformApi } from "../src/api/platform.js";
import { usePlatform } from "../src/platform/PlatformState.js";
import "./login.css";

function CodeLogin() {
  const { t } = usePlatform();
  const navigate = useNavigate();
  const { loadSession } = usePlatform();

  const [code, setCode] = React.useState("");
  const [studentCode, setStudentCode] = React.useState("");
  const [codeError, setCodeError] = React.useState("");
  const [isCheckingCode, setIsCheckingCode] = React.useState(false);

  const onCodeSubmit = async () => {
    if (isCheckingCode) return;
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode || !studentCode.trim()) {
      setCodeError(
        t("Enter your code and the worksheet code from your teacher."),
      );
      return;
    }

    setIsCheckingCode(true);
    setCodeError("");

    try {
      const worksheet = await platformApi.enterGame(studentCode, cleanCode);
      await loadSession();
      const history = await platformApi.history(worksheet.assignmentId);
      const attempt =
        history.find((entry) => entry.status === "IN_PROGRESS") ||
        (await platformApi.start(worksheet.assignmentId));

      sessionStorage.removeItem("pending-worksheet-code");
      setCodeError("");
      navigate(`/attempts/${attempt.id}`);
    } catch (requestError) {
      setCodeError(requestError.message || t("Worksheet code not found"));
    } finally {
      setIsCheckingCode(false);
    }
  };

  return (
    <main className="code-login-page">
      <span className="page-doodle page-doodle-plus" aria-hidden="true">
        +
      </span>
      <span className="page-doodle page-doodle-star" aria-hidden="true">
        ★
      </span>
      <span className="page-doodle page-doodle-circle" aria-hidden="true" />

      <section className="code-login-shell">
        <div className="code-login-copy">
          <span className="code-login-eyebrow">
            <ReadOutlined aria-hidden="true" /> Practica
          </span>
          <h1>
            {t("Learning through")} <span>{t("play!")}</span>
          </h1>
          <p>
            {t(
              "Colourful exercises, clever challenges and joy with every correct answer.",
            )}{" "}
          </p>
          <div
            className="code-login-badges"
            aria-label={t("Platform benefits")}
          >
            <span>{t("🎮 Interactive games")}</span>
            <span>{t("🌍 Romanian & English")}</span>
            <span>{t("✨ Learning with a smile")}</span>
          </div>
        </div>

        <div className="code-login-card">
          <div className="code-login-card-icon" aria-hidden="true">
            <ReadOutlined />
          </div>
          <h2>{t("Got your codes?")}</h2>
          <p>
            {t(
              "Enter your code and the worksheet code. You don't need an account.",
            )}
          </p>

          <div className="code-login-form">
            <label htmlFor="student-entry-code">{t("Student code")}</label>
            <Input
              id="student-entry-code"
              maxLength={8}
              placeholder={t("Your code")}
              className="pin-input"
              value={studentCode}
              aria-label={t("Student code")}
              disabled={isCheckingCode}
              onChange={(event) => {
                setStudentCode(event.target.value.toUpperCase());
                setCodeError("");
              }}
              onPressEnter={onCodeSubmit}
            />
            <label htmlFor="worksheet-entry-code">{t("Worksheet code")}</label>
            <Input
              id="worksheet-entry-code"
              maxLength={9}
              placeholder={t("Worksheet code")}
              className="pin-input"
              value={code}
              disabled={isCheckingCode}
              aria-label={t("Worksheet code")}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setCodeError("");
              }}
              onPressEnter={onCodeSubmit}
            />

            {codeError && (
              <div className="pin-error" role="alert">
                {t(codeError)}
              </div>
            )}

            <Button
              type="primary"
              className="enter-button"
              onClick={onCodeSubmit}
              loading={isCheckingCode}
            >
              {t("Check and start")}{" "}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CodeLogin;
