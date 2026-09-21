import React from "react";
import { Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const SignUp = () => {
const [passwordVisible, setPasswordVisible] = React.useState(false);
const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false);

const navigate = useNavigate();

return (
    <div className="auth-container">
        <div className="auth-form">

            <Input
                placeholder="Username"
                maxLength={25}
                className="username-input"
            />

            <Input.Password
                placeholder="Password"
                maxLength={25}
                visibilityToggle={{
                    visible: passwordVisible,
                    onVisibleChange: setPasswordVisible
                }}
                className="password-input"
            />

            <Input.Password
                placeholder="Confirm Password"
                maxLength={25}
                visibilityToggle={{
                    visible: confirmPasswordVisible,
                    onVisibleChange: setConfirmPasswordVisible
                }}
                className="password-input"
            />

            <Button
                type="primary"
                className="enter-button"
                onClick={() => navigate("/account")}
            >
                Enter
            </Button>

        </div>
    </div>
);

};

export default SignUp;
