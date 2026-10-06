import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import "./Auth.css";

const SignUp = () => {

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
        if (password !== confirmPassword) {
            setError("Confirm password is not correct");
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
        <div className="auth-container">
            <div className="auth-form">
                <h1>Cont pentru profesori</h1>
                <p>Copiii intră în joc cu codurile primite de la profesor.</p>

                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    maxLength={254}
                    onChange={(event) => setEmail(event.target.value)}
                />

                <Input
                    placeholder="Username"
                    maxLength={25}
                    value={name}
                    className="username-input"
                    onChange={(e) => setName(e.target.value)}
                />

                <Input.Password
                    placeholder="Password"
                    maxLength={25}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    visibilityToggle={{
                        visible: passwordVisible,
                        onVisibleChange: setPasswordVisible
                    }}
                    className="password-input"
                />

                <Input.Password
                    placeholder="Confirm Password"
                    maxLength={25}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    visibilityToggle={{
                        visible: confirmPasswordVisible,
                        onVisibleChange: setConfirmPasswordVisible
                    }}
                    className="password-input"
                />

                <Button
                    type="primary"
                    className="enter-button"
                    loading={isSubmitting}
                    onClick={handleSighnUp}
                >
                    Create Acount
                </Button>

                {error && (
                    <Alert
                        type="error"
                        message={error}
                        showIcon
                    />
                )}

            </div>
        </div>
    );
};

export default SignUp;
