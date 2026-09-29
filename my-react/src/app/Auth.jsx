import { useState } from "react";
import { Button, Form, Input, Segmented } from "antd";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/platform.js";
import { useApp } from "./state.js";
import { ErrorNotice } from "./ui.jsx";
export function JoinForm({ classroom = false, onJoined }) {
  const { t, user } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  async function join({ code }) {
    if (!user) {
      sessionStorage.setItem("pending-worksheet-code", code);
      navigate("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await (classroom
        ? api.joinClass(code)
        : api.joinWorksheet(code));
      sessionStorage.removeItem("pending-worksheet-code");
      onJoined?.();
      navigate(
        classroom
          ? `/classes/${result.id}`
          : `/assignments/${result.assignmentId}`,
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={join}
      initialValues={{
        code: classroom
          ? ""
          : sessionStorage.getItem("pending-worksheet-code") || "",
      }}
    >
      <ErrorNotice error={error} />
      <Form.Item
        name="code"
        label={t(classroom ? "Class code" : "Worksheet code")}
        rules={[{ required: true, whitespace: true }]}
      >
        <Input
          autoComplete="off"
          maxLength={30}
          placeholder="ABC-123"
          className="code-input"
        />
      </Form.Item>
      <Button
        block
        type="primary"
        htmlType="submit"
        loading={busy}
        icon={<ArrowRight size={17} />}
      >
        {t(classroom ? "Join class" : "Join worksheet")}
      </Button>
    </Form>
  );
}
export function Landing() {
  const { t, user } = useApp();
  if (user)
    return (
      <Navigate
        to={
          user.role === "USER" &&
          sessionStorage.getItem("pending-worksheet-code")
            ? "/assignments?join=1"
            : "/home"
        }
        replace
      />
    );
  return (
    <div className="landing">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={15} />
            {t("Made for curious minds")}
          </p>
          <h1>{t("Learning, a little brighter.")}</h1>
          <p className="hero-copy">
            {t("Thoughtful activities. Small steps. Big discoveries.")}
          </p>
          <div className="actions">
            <Link className="primary-link" to="/signup">
              {t("Create an account")} <ArrowRight size={18} />
            </Link>
            <Link to="/login">{t("Sign in")}</Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-sheet">
            <span className="art-label">WORKSHEETS</span>
            <div className="art-line" />
            <div className="art-line short" />
            <div className="art-equation">
              2 + 3 = <span>5</span>
            </div>
            <div className="art-shapes">
              <i />
              <i />
              <i />
            </div>
            <div className="art-progress">
              <span />
            </div>
          </div>
          <div className="art-badge">
            <Sparkles size={26} />
          </div>
          <span className="art-dot" />
        </div>
      </section>
      <section className="entry-grid">
        <div className="panel join-panel">
          <span className="icon-tile">
            <GraduationCap />
          </span>
          <h2>{t("Join with a code")}</h2>
          <p className="muted">
            {t("Sign in as a student to join your teacher’s worksheet.")}
          </p>
          <JoinForm />
        </div>
        <div className="principles">
          {[
            [BookOpen, "Create", "Build activities that fit your learners."],
            [Layers, "Share", "Bring your class together with a simple code."],
            [Sparkles, "Learn", "Make progress, one discovery at a time."],
          ].map(([Icon, title, copy], i) => (
            <div className="principle" key={title}>
              <span className={`icon-tile tone-${i}`}>
                <Icon size={21} />
              </span>
              <div>
                <h3>{t(title)}</h3>
                <p>{t(copy)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
export function AuthPage({ signup = false }) {
  const { t, user, setUser } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (user)
    return (
      <Navigate
        to={
          user.role === "USER" &&
          sessionStorage.getItem("pending-worksheet-code")
            ? "/assignments?join=1"
            : "/home"
        }
        replace
      />
    );
  async function submit(values) {
    setBusy(true);
    setError(null);
    try {
      const account = await (signup ? api.signup(values) : api.login(values));
      setUser(account);
      const code = sessionStorage.getItem("pending-worksheet-code");
      navigate(
        code && account.role === "USER" ? "/assignments?join=1" : "/home",
        { replace: true },
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">{t("Your learning space")}</p>
        <h1>{t("A calm place to create, share, and learn together.")}</h1>
        <div className="auth-symbol">
          <BookOpen size={80} strokeWidth={1} />
        </div>
      </div>
      <section className="panel auth-panel">
        <h2>{t(signup ? "Start something wonderful" : "Welcome back")}</h2>
        <ErrorNotice error={error} />
        <Form
          layout="vertical"
          onFinish={submit}
          initialValues={{ role: "TEACHER" }}
        >
          {signup && (
            <>
              <Form.Item
                label={t("Name")}
                name="name"
                rules={[{ required: true, whitespace: true }]}
              >
                <Input autoComplete="name" maxLength={100} />
              </Form.Item>
              <Form.Item label={t("I am a")} name="role">
                <Segmented
                  block
                  options={[
                    { label: t("Teacher"), value: "TEACHER" },
                    { label: t("Student"), value: "USER" },
                  ]}
                />
              </Form.Item>
            </>
          )}
          <Form.Item
            label={t("Email")}
            name="email"
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input type="email" autoComplete="email" />
          </Form.Item>
          <Form.Item
            label={t("Password")}
            name="password"
            rules={[
              { required: true },
              ...(signup
                ? [
                    {
                      min: 15,
                      message: t(
                        "Use a password between 15 and 128 characters.",
                      ),
                    },
                  ]
                : []),
            ]}
          >
            <Input.Password
              autoComplete={signup ? "new-password" : "current-password"}
              maxLength={128}
            />
          </Form.Item>
          <Button type="primary" block htmlType="submit" loading={busy}>
            {t(signup ? "Create an account" : "Sign in")}
          </Button>
        </Form>
        <p className="auth-alternative">
          {t(signup ? "Already have an account?" : "New here?")}{" "}
          <Link to={signup ? "/login" : "/signup"}>
            {t(signup ? "Sign in" : "Create an account")}
          </Link>
        </p>
      </section>
    </div>
  );
}
