import { ReadOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { usePlatform } from "../platform/PlatformState.js";
import "./Auth.css";

export default function AuthShell({ title, children, signup = false }) {
  const { t } = usePlatform();
  return (
    <main className="auth-container">
      <div className="auth-shell">
        <section className="auth-story">
          <Link to="/" className="auth-brand">
            <ReadOutlined aria-hidden="true" /> Practica
          </Link>
          <div className="auth-illustration" aria-hidden="true">
            <span className="auth-pencil" />
            <div className="auth-notebook">
              <ReadOutlined />
              <span>2 + 3 = 5</span>
              <span className="auth-notebook-stars">★ ★ ★</span>
            </div>
          </div>
        </section>
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title">{title}</h1>
          {children}
          <p className="auth-switch">
            {t(signup ? "Already have an account?" : "New to Practica?")}{" "}
            <Link to={signup ? "/login" : "/signup"}>
              {t(signup ? "Log in" : "Create account")}
            </Link>
          </p>
          <Link className="auth-student-link" to="/">
            {t("Play")}
          </Link>
        </section>
      </div>
    </main>
  );
}
