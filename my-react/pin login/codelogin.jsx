import React from "react";
import { Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { platformApi } from "../src/api/platform.js";
import { usePlatform } from "../src/platform/PlatformState.js";
import "./login.css";

function CodeLogin() {
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
  setCodeError("Scrie codul tău și codul fișei primite de la profesor.");
  return;
}

setIsCheckingCode(true);
setCodeError("");

try {
  const worksheet = await platformApi.enterGame(studentCode, cleanCode);
  await loadSession();
  const history = await platformApi.history(worksheet.assignmentId);
  const attempt = history.find((entry) => entry.status === "IN_PROGRESS")
    || await platformApi.start(worksheet.assignmentId);

  sessionStorage.removeItem("pending-worksheet-code");
  setCodeError("");
  navigate(`/attempts/${attempt.id}`);
} catch (requestError) {
  setCodeError(
    requestError.message || "Worksheet code not found"
  );
} finally {
  setIsCheckingCode(false);
}

};

return (
  <main className="code-login-page">
    <span className="page-doodle page-doodle-plus" aria-hidden="true">+</span>
    <span className="page-doodle page-doodle-star" aria-hidden="true">★</span>
    <span className="page-doodle page-doodle-circle" aria-hidden="true" />

    <section className="code-login-shell">
      <div className="code-login-copy">
        <span className="code-login-eyebrow">CAIETUL CU JOCURI</span>
        <h1>
          Învățăm prin <span>joacă!</span>
        </h1>
        <p>
          Exerciții colorate, provocări istețe și multă bucurie la fiecare
          răspuns corect.
        </p>
        <div className="code-login-badges" aria-label="Avantajele platformei">
          <span>🎮 Jocuri interactive</span>
          <span>🇷🇴 În limba română</span>
          <span>✨ Învățare cu zâmbet</span>
        </div>
      </div>

      <div className="code-login-card">
        <div className="code-login-card-icon" aria-hidden="true">🚀</div>
        <h2>Ai primit codurile?</h2>
        <p>Scrie codul tău și codul fișei. Nu ai nevoie de cont.</p>

        <div className="code-login-form">
          <Input
            maxLength={8}
            placeholder="CODUL TĂU"
            className="pin-input"
            value={studentCode}
            aria-label="Codul elevului"
            disabled={isCheckingCode}
            onChange={(event) => { setStudentCode(event.target.value.toUpperCase()); setCodeError(""); }}
            onPressEnter={onCodeSubmit}
          />
          <Input
            maxLength={9}
            placeholder="CODUL FIȘEI"
            className="pin-input"
            value={code}
            disabled={isCheckingCode}
            aria-label="Codul fișei de lucru"
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setCodeError("");
            }}
            onPressEnter={onCodeSubmit}
          />

          {codeError && (
            <div className="pin-error" role="alert">
              {codeError}
            </div>
          )}

          <Button
            type="primary"
            className="enter-button"
            onClick={onCodeSubmit}
            loading={isCheckingCode}
          >
            Verifică și începe
          </Button>
        </div>
      </div>
    </section>
  </main>
);
}

export default CodeLogin;
