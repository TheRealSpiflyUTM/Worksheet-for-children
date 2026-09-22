import React from "react";
import { Button, Layout, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";
import "./AuthButtons.css";

const { Header } = Layout;

function AuthButtons() {
const navigate = useNavigate();

const {
    token: { colorBgContainer },
} = theme.useToken();

return (
    <Header
        style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            padding: 0,
            background: colorBgContainer,
            zIndex: 100,
        }}
    >
        {/* Home button */}
        <Button
            type="text"
            className="home-button"
            icon={<HomeOutlined />}
            onClick={() => navigate("/")}
        >
            
        </Button>

        {/* Login and Sign Up buttons */}
        <div className="auth-buttons">

            <Button
                className="login-button"
                onClick={() => navigate("/login")}
            >
                Login
            </Button>

            <Button
                type="primary"
                className="signup-button"
                onClick={() => navigate("/signup")}
            >
                Sign Up
            </Button>

        </div>
    </Header>
);

}

export default AuthButtons;
