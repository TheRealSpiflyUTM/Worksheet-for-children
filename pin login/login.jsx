import React from 'react';
import { Input, Button, Cascader } from 'antd';
import './login.css';

// Replace with the actual list of students for the class
const options = [
  { value: '1', label: 'Student Name 1' },
  { value: '2', label: 'Student Name 2' },
  { value: '3', label: 'Student Name 3' },
];

// Replace with a real check against your backend (e.g. fetch to verify the PIN)
const CORRECT_PIN = '1234';

const filter = (inputValue, path) =>
  path.some((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

function Login() {
  const [pin, setPin] = React.useState('');
  const [pinVerified, setPinVerified] = React.useState(false);
  const [pinError, setPinError] = React.useState('');
  const [studentId, setStudentId] = React.useState(null);

  const onPinSubmit = () => {
    if (pin.trim() === CORRECT_PIN) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinError('Wrong PIN, try again');
    }
  };

  const onNameChange = (value) => {
    setStudentId(value);
  };

  return (
    <div className="auth-container">
      <div className="auth-form">

        <Input
          placeholder="PIN"
          className="pin-input"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setPinError('');
          }}
          onPressEnter={onPinSubmit}
          disabled={pinVerified}
        />

        {pinError && <div className="pin-error">{pinError}</div>}

        {pinVerified && (
          <Cascader
            options={options}
            onChange={onNameChange}
            placeholder="Select your name"
            className="name-select"
            showSearch={{ filter }}
          />
        )}

        <Button
          type="primary"
          className="enter-button"
          onClick={pinVerified ? undefined : onPinSubmit}
          disabled={pinVerified && !studentId}
        >
          Enter
        </Button>

      </div>
    </div>
  );
}

export default Login;
