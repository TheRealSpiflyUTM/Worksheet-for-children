import { lazy, Suspense, useState } from "react";
import { Button, Drawer } from "antd";
import {
  BookOpen,
  ClipboardList,
  Home,
  Leaf,
  LogOut,
  Menu,
  UserRound,
  Users,
} from "lucide-react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppProvider } from "./app/context.jsx";
import { useApp } from "./app/state.js";
import { ErrorNotice, LanguageSwitch, Loading } from "./app/ui.jsx";
import { AuthPage, Landing } from "./app/Auth.jsx";
import {
  Account,
  Assignments,
  Classes,
  ClassDetail,
  Dashboard,
  WorksheetLibrary,
} from "./app/Pages.jsx";
import {
  AssignmentDetail,
  AttemptPage,
  LegacyWorksheetEntry,
} from "./app/Attempts.jsx";
import { api } from "./api/platform.js";
const Editor = lazy(() =>
  import("./app/Editor.jsx").then((module) => ({ default: module.Editor })),
);
const navigation = [
  ["/home", "Overview", Home],
  ["/sheets", "Worksheets", BookOpen],
  ["/classes", "Classes", Users],
  ["/assignments", "Assignments", ClipboardList],
  ["/account", "Account", UserRound],
];
function Brand() {
  return (
    <Link to="/" className="brand">
      <span>
        <Leaf size={22} />
      </span>
      littleleaf<span className="brand-dot">.</span>
    </Link>
  );
}
function Navigation({ onNavigate }) {
  const { t } = useApp();
  return (
    <nav aria-label={t("Workspace")}>
      {navigation.map(([to, title, Icon]) => (
        <NavLink key={to} to={to} onClick={onNavigate}>
          <Icon size={19} strokeWidth={1.7} />
          {t(title)}
        </NavLink>
      ))}
    </nav>
  );
}
function Shell() {
  const { t, user, setUser, loading, sessionError, loadSession } = useApp();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const publicPage = ["/", "/login", "/signup"].includes(location.pathname);
  const focused = location.pathname.startsWith("/attempts/");
  async function logout() {
    setSigningOut(true);
    try {
      await api.logout();
      setUser(null);
    } catch (e) {
      setError(e);
    } finally {
      setSigningOut(false);
    }
  }
  if (loading) return <Loading />;
  if (sessionError)
    return (
      <div className="session-error">
        <ErrorNotice error={sessionError} retry={loadSession} />
      </div>
    );
  if (!user && !publicPage) return <Navigate to="/login" replace />;
  const content = (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage key="login" />} />
        <Route path="/signup" element={<AuthPage key="signup" signup />} />
        {user && (
          <>
            <Route path="/home" element={<Dashboard />} />
            <Route
              path="/home/:className"
              element={<Navigate to="/classes" replace />}
            />
            <Route path="/sheets" element={<WorksheetLibrary />} />
            <Route path="/teacher/:worksheetId" element={<Editor />} />
            <Route
              path="/teacher"
              element={<Navigate to="/sheets" replace />}
            />
            <Route
              path="/kids"
              element={<Navigate to="/assignments" replace />}
            />
            <Route
              path="/kids/:worksheetId"
              element={<LegacyWorksheetEntry />}
            />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ClassDetail />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assignments/:id" element={<AssignmentDetail />} />
            <Route path="/attempts/:id" element={<AttemptPage />} />
            <Route path="/account" element={<Account />} />
          </>
        )}
        <Route
          path="*"
          element={
            <div className="empty-state">
              <h1>{t("Page not found")}</h1>
              <Link to={user ? "/home" : "/"}>{t("Return to overview")}</Link>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
  return (
    <div
      className={
        user && !publicPage
          ? `app-layout ${focused ? "focused-layout" : ""}`
          : "public-layout"
      }
    >
      <a href="#main-content" className="skip-link">
        {t("Skip to content")}
      </a>
      {user && !publicPage && !focused && (
        <aside className="sidebar">
          <Brand />
          <p className="nav-caption">{t("Workspace")}</p>
          <Navigation />
          <div className="sidebar-note">
            <span className="tiny-leaf">
              <Leaf size={19} />
            </span>
            <p>{t("Small steps. Big discoveries.")}</p>
          </div>
          <div className="sidebar-account">
            <span className="avatar-circle">{user.name[0]}</span>
            <div className="grow">
              <strong>{user.name}</strong>
              <small>
                {t(
                  user.role === "TEACHER"
                    ? "Teacher"
                    : user.role === "USER"
                      ? "Student"
                      : user.role,
                )}
              </small>
            </div>
            <Button
              type="text"
              aria-label={t("Sign out")}
              loading={signingOut}
              icon={<LogOut size={17} />}
              onClick={logout}
            />
          </div>
        </aside>
      )}
      <div className="app-body">
        <header className="topbar">
          {!user || publicPage || focused ? (
            <Brand />
          ) : (
            <>
              <Button
                className="mobile-menu"
                type="text"
                aria-label={t("Menu")}
                icon={<Menu size={23} />}
                onClick={() => setDrawer(true)}
              />
              <span className="topbar-caption">
                {t("A little preparation. A lot of possibility.")}
              </span>
            </>
          )}
          <div className="actions">
            <LanguageSwitch />
            {!user ? (
              <Link to="/login" className="header-signin">
                {t("Sign in")} <span>↗</span>
              </Link>
            ) : (
              <Link to="/account" className="topbar-user">
                <span className="avatar-circle small">{user.name[0]}</span>
                <span>{user.name.split(" ")[0]}</span>
              </Link>
            )}
          </div>
        </header>
        <main
          id="main-content"
          className={user && !publicPage ? "workspace-main" : "public-main"}
        >
          <ErrorNotice error={error} />
          {content}
        </main>
        {!user && (
          <footer className="public-footer">
            <Brand />
            <span>{t("Made for curious minds")}</span>
          </footer>
        )}
      </div>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        placement="left"
        width={280}
        title={<Brand />}
      >
        <Navigation onNavigate={() => setDrawer(false)} />
        <Button onClick={logout} loading={signingOut}>
          {t("Sign out")}
        </Button>
      </Drawer>
    </div>
  );
}
export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
