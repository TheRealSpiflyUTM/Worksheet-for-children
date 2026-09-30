import { useState } from "react";
import { Alert, Button, Input, Segmented } from "antd";
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
    const [role, setRole] = useState("TEACHER");
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
                    role,
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

                <div className="signup-role-field">
                    <span>I am a</span>
                    <Segmented
                        block
                        value={role}
                        onChange={setRole}
                        options={[
                            { label: "Teacher", value: "TEACHER" },
                            { label: "Student", value: "USER" },
                        ]}
                    />
                </div>

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
