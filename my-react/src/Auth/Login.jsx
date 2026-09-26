import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.js";
import "./Auth.css";

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(false);

    const navigate = useNavigate();

    async function handleLogin() {
        if(!email.trim()){
            setError("Enter your email adress");
            return;
        }
        if(!password){
            setError("Enter your password");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try{
            const user = await login(email , password);

            if(user.role === "TEACHER"){
                navigate("/sheets");
            }
            else{
                navigate("/home");
            }
        }catch(error){
            setError(error.message);
        }finally{
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
                    maxLength={50}
                    autoComplete="email"
                    disabled={isSubmitting}
                    onChange={(event) => setEmail(event.target.value)}
                    onPressEnter={handleLogin}
                />

                <Input.Password
                    placeholder="Password"
                    value={password}
                    maxLength={60}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    onChange={(event) => setPassword(event.target.value)}
                    onPressEnter={handleLogin}
                    visibilityToggle={{
                        visible: passwordVisible,
                        onVisibleChange: setPasswordVisible,
                    }}
                    className="password-input"
                />

                <Button
                    type="primary"
                    className="enter-button"
                    loading={isSubmitting}
                    onClick={handleLogin}
                >
                Log in
                </Button>

                {error && (
                    <Alert
                        type="error"
                        title={error}
                        showIcon
                    />
                )}

            </div>
        </div>
    );

};

export default Login;
