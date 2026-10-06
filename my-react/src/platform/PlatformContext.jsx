import { useCallback, useEffect, useMemo, useState } from "react";
import { platformApi } from "../api/platform.js";
import { translate } from "./translations.js";
import { PlatformStateContext } from "./PlatformState.js";

function initialLanguage() {
  try {
    const saved = localStorage.getItem("worksheet-language");
    if (saved === "en" || saved === "ro") return saved;
  } catch {
    // Storage is optional.
  }
  return navigator.language?.toLowerCase().startsWith("ro") ? "ro" : "en";
}

export function PlatformProvider({ children }) {
  const [language, setLanguageState] = useState(initialLanguage);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setSessionError(null);
    try {
      setUser(await platformApi.me());
    } catch (error) {
      if (error.status !== 401) setSessionError(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadSession);
  }, [loadSession]);

  useEffect(() => {
    const expire = () => setUser(null);
    const refresh = () => void loadSession();
    window.addEventListener("session-expired", expire);
    window.addEventListener("session-updated", refresh);
    return () => {
      window.removeEventListener("session-expired", expire);
      window.removeEventListener("session-updated", refresh);
    };
  }, [loadSession]);

  const t = useCallback(
    (text, values) => translate(language, text, values),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(nextLanguage) {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
    try {
      localStorage.setItem("worksheet-language", nextLanguage);
    } catch {
      // Storage is optional.
    }
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      user,
      setUser,
      loading,
      sessionError,
      loadSession,
    }),
    [language, t, user, loading, sessionError, loadSession],
  );

  return (
    <PlatformStateContext.Provider value={value}>
      {children}
    </PlatformStateContext.Provider>
  );
}
