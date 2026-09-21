import React from "react";
import { Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
const [passwordVisible, setPasswordVisible] = React.useState(false);

const navigate = useNavigate();

return (
    <div className="auth-container">
        <div className="auth-form">

            <Input
                placeholder="Username"
                maxLength={25}
                className="username-input"
            />

            <div className="password-row">
                <Input.Password
                    placeholder="Password"
                    maxLength={25}
                    visibilityToggle={{
                        visible: passwordVisible,
                        onVisibleChange: setPasswordVisible
                    }}
                    className="password-input"
                />
            </div>

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

export default Login;
