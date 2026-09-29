import { useCallback, useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import roRO from "antd/locale/ro_RO";
import { api } from "../api/platform.js";
import { initialLanguage, translate } from "./translations.js";
import { Context } from "./state.js";
export function AppProvider({ children }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const t = useCallback((text) => translate(language, text), [language]);
  const loadSession = useCallback(async () => {
    setLoading(true);
    setSessionError(null);
    try {
      setUser(await api.me());
    } catch (e) {
      if (e.status !== 401) setSessionError(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(loadSession);
  }, [loadSession]);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem("worksheet-language", language);
    } catch {
      /* Optional preference. */
    }
  }, [language]);
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat(language === "ro" ? "ro-RO" : "en-GB", {
          dateStyle: "medium",
        }).format(new Date(value))
      : "—";
  return (
    <Context.Provider
      value={{
        language,
        setLanguage,
        t,
        date,
        user,
        setUser,
        loading,
        sessionError,
        loadSession,
      }}
    >
      <ConfigProvider
        locale={language === "ro" ? roRO : enUS}
        theme={{
          token: {
            colorPrimary: "#256b60",
            colorInfo: "#256b60",
            colorInfoBg: "#edf4ee",
            colorInfoBorder: "#cadacb",
            colorText: "#243a35",
            colorTextSecondary: "#65736e",
            colorBorder: "#dce3dc",
            borderRadius: 10,
            controlHeight: 42,
            fontFamily: '"Geist Variable", system-ui, sans-serif',
          },
        }}
        form={{
          validateMessages: {
            required: t("Please complete this field."),
            types: { email: t("Enter a valid email address.") },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </Context.Provider>
  );
}
