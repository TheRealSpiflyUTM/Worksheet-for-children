import React from "react";
import { Input, Button, Cascader } from "antd";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../src/api/client.js";
import "./login.css";

// Replace with the actual list of students for the class
const options = [
{ value: "1", label: "Student Name 1" },
{ value: "2", label: "Student Name 2" },
{ value: "3", label: "Student Name 3" },
];

const filter = (inputValue, path) =>
path.some((option) =>
option.label.toLowerCase().includes(inputValue.toLowerCase())
);

function CodeLogin() {
const navigate = useNavigate();

const [code, setCode] = React.useState("");
const [codeVerified, setCodeVerified] = React.useState(false);
const [codeError, setCodeError] = React.useState("");
const [studentId, setStudentId] = React.useState(null);
const [worksheetId, setWorksheetId] = React.useState(null);
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

  setWorksheetId(worksheet.id);
  setCodeVerified(true);
  setCodeError("");
} catch (requestError) {
  setCodeError(
    requestError.message || "Worksheet code not found"
  );
} finally {
  setIsCheckingCode(false);
}

};

const onNameChange = (value) => {
setStudentId(value);
};

const onEnter = () => {
if (!worksheetId || !studentId) {
return;
}

navigate(`/kids/${worksheetId}`);

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
            disabled={codeVerified}
          />

          {codeError && (
            <div className="pin-error" role="alert">
              {codeError}
            </div>
          )}

          {!codeVerified && (
            <Button
              type="primary"
              className="enter-button"
              onClick={onCodeSubmit}
              loading={isCheckingCode}
            >
              Verifică codul
            </Button>
          )}

          {codeVerified && (
            <>
              <Cascader
                options={options}
                onChange={onNameChange}
                placeholder="Alege numele tău"
                className="name-select"
                showSearch={{ filter }}
              />

              <Button
                type="primary"
                className="enter-button"
                onClick={onEnter}
                disabled={!studentId}
              >
                Începe aventura
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  </main>
);
}

export default CodeLogin;
