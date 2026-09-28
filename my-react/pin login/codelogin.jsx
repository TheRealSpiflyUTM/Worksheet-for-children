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

return ( <div className="auth-container"> <div className="auth-form">

    <Input
      maxLength={9}
      placeholder="Worksheet code"
      className="pin-input"
      value={code}
      onChange={(e) => {
        setCode(e.target.value.toUpperCase());
        setCodeError("");
      }}
      onPressEnter={onCodeSubmit}
      disabled={codeVerified}
    />

    {codeError && (
      <div className="pin-error">
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
        Check code
      </Button>
    )}

    {codeVerified && (
      <>
        <Cascader
          options={options}
          onChange={onNameChange}
          placeholder="Select your name"
          className="name-select"
          showSearch={{ filter }}
        />

        <Button
          type="primary"
          className="enter-button"
          onClick={onEnter}
          disabled={!studentId}
        >
          Enter
        </Button>
      </>
    )}

  </div>
</div>

);
}

export default CodeLogin;
