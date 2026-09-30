import React from "react";
import { Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../src/api/client.js";
import "./login.css";

function CodeLogin() {
const navigate = useNavigate();

const [code, setCode] = React.useState("");
const [codeError, setCodeError] = React.useState("");
const [isCheckingCode, setIsCheckingCode] = React.useState(false);

const onCodeSubmit = async () => {
const cleanCode = code.trim().toUpperCase();

if (!cleanCode) {
  setCodeError("Enter the worksheet code");
  return;
}

setIsCheckingCode(true);
setCodeError("");

try {
  const worksheet = await apiRequest("/api/worksheets/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: cleanCode,
    }),
  });

  sessionStorage.removeItem("pending-worksheet-code");
  setCodeError("");
  navigate(`/assignments/${worksheet.assignmentId}`);
} catch (requestError) {
  if (requestError.status === 401) {
    sessionStorage.setItem("pending-worksheet-code", cleanCode);
    navigate("/login");
    return;
  }
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
        <h2>Ai primit un cod?</h2>
        <p>Scrie-l mai jos și aventura poate începe.</p>

        <div className="code-login-form">
          <Input
            maxLength={9}
            placeholder="CODUL FIȘEI"
            className="pin-input"
            value={code}
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
