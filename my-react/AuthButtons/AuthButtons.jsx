import { Button, Layout, message, theme } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";
import "./AuthButtons.css";
import { usePlatform } from "../src/platform/PlatformState.js";
import { platformApi } from "../src/api/platform.js";

const { Header } = Layout;

function AuthButtons() {
  const { t } = usePlatform();
  const navigate = useNavigate();
  const { user, setUser } = usePlatform();
  const [busy, setBusy] = useState(false);

  async function leave() {
    setBusy(true);
    try {
      await platformApi.logout();
      setUser(null);
      navigate("/");
    } catch (error) {
      message.error(error.message);
    } finally {
      setBusy(false);
    }
  }

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
        <span className="home-button-label">{t("Play")}</span>
      </Button>

      {/* Login and Sign Up buttons */}
      <div className="auth-buttons">
        {user ? (
          <>
            {user.role === "TEACHER" && (
              <Button onClick={() => navigate("/home")}>
                {t("My classes")}
              </Button>
            )}
            <Button loading={busy} onClick={leave}>
              {user.role === "USER" ? t("Another child") : t("Log out")}
            </Button>
          </>
        ) : (
          <>
            <Button className="login-button" onClick={() => navigate("/login")}>
              {t("Teacher login")}{" "}
            </Button>

            <Button
              type="primary"
              className="signup-button"
              onClick={() => navigate("/signup")}
            >
              {t("Teacher account")}{" "}
            </Button>
          </>
        )}
      </div>
    </Header>
  );
}

export default AuthButtons;
