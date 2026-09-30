import { useCallback, useEffect, useMemo, useState } from "react";
import { platformApi } from "../api/platform.js";
import { PlatformStateContext } from "./PlatformState.js";

const ROMANIAN = {
  Classes: "Clase",
  Assignments: "Teme",
  Members: "Elevi",
  "Join class": "Intră în clasă",
  "New class": "Clasă nouă",
  "Class code": "Codul clasei",
  "Join worksheet": "Deschide fișa",
  "Worksheet code": "Codul fișei",
  "Start learning": "Începe",
  "Continue learning": "Continuă",
  "Try again": "Încearcă din nou",
  "Skip activity": "Sari peste activitate",
  "Finish worksheet": "Finalizează fișa",
  "Correct!": "Corect!",
  "Check answer": "Verifică răspunsul",
  Next: "Următorul",
  Back: "Înapoi",
  History: "Istoric",
  Language: "Limbă",
  Welcome: "Bun venit",
  Worksheets: "Fișe de lucru",
  Account: "Cont",
  "Log out": "Deconectare",
};

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

  function setLanguage(nextLanguage) {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
    try {
      localStorage.setItem("worksheet-language", nextLanguage);
    } catch {
      // Storage is optional.
    }
  }

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (text) => language === "ro" ? ROMANIAN[text] || text : text,
    user,
    setUser,
    loading,
    sessionError,
    loadSession,
  }), [language, user, loading, sessionError, loadSession]);

  return <PlatformStateContext.Provider value={value}>{children}</PlatformStateContext.Provider>;
}
