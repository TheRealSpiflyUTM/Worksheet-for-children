import { useEffect, useRef, useState } from "react";
import { Button, Layout, Tooltip } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import MenuList from "./MenuList";
import { EditorHeaderContext } from "./EditorHeaderContext.js";
import "./LeftSidebar.css";
import { usePlatform } from "../platform/PlatformState.js";
import { LanguageButton } from "../platform/PlatformPages.jsx";

const { Header, Sider, Content } = Layout;

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const HEADER_HEIGHT = 64;
const COLLAPSED_KEY = "practica.sidebar.collapsed";

function desktopCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function LeftSidebar({ children }) {
  const { t } = usePlatform();
  const { pathname } = useLocation();
  const editingWorksheet = pathname.startsWith("/teacher/");
  const pageName = pathname.startsWith("/classes")
    ? "Classes"
    : pathname.startsWith("/sheets")
      ? "Worksheets"
      : pathname.startsWith("/account")
        ? "Account"
        : pathname.startsWith("/assignments") ||
            pathname.startsWith("/attempts")
          ? "Assignments"
          : "Home";
  const [collapsed, setCollapsed] = useState(
    () => window.innerWidth < 768 || desktopCollapsed(),
  );
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  const toggleRef = useRef(null);
  const [toolbarHost, setToolbarHost] = useState(null);
  const [editorHeaderHeight, setEditorHeaderHeight] = useState(88);

  useEffect(() => {
    if (!toolbarHost) return;
    const observer = new ResizeObserver(([entry]) => {
      setEditorHeaderHeight(
        Math.max(88, Math.ceil(entry.contentRect.height) + 24),
      );
    });
    observer.observe(toolbarHost);
    return () => observer.disconnect();
  }, [toolbarHost]);

  function closeDrawer() {
    setCollapsed(true);
    toggleRef.current?.focus();
  }

  function toggleNavigation() {
    const next = !collapsed;
    setCollapsed(next);
    if (!mobile) {
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {
        /* Navigation still works when storage is unavailable. */
      }
    }
  }

  useEffect(() => {
    if (!mobile || collapsed) return;
    function handleKey(event) {
      if (event.key === "Escape") {
        setCollapsed(true);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobile, collapsed]);

  const sidebarWidth = mobile
    ? 0
    : collapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH;

  return (
    <Layout
      className={editingWorksheet ? "worksheet-editor-shell" : "workbook-shell"}
      style={{
        minHeight: "100vh",
        "--app-header-height": `${editingWorksheet ? editorHeaderHeight : HEADER_HEIGHT}px`,
      }}
    >
      <Sider
        theme="light"
        width={SIDEBAR_EXPANDED_WIDTH}
        collapsedWidth={mobile ? 0 : SIDEBAR_COLLAPSED_WIDTH}
        collapsed={collapsed}
        breakpoint="md"
        onBreakpoint={(broken) => {
          setMobile(broken);
          setCollapsed(broken || desktopCollapsed());
        }}
        collapsible
        trigger={null}
        className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
        style={{
          position: "fixed",
          top: mobile ? "var(--app-header-height)" : 0,
          left: 0,
          bottom: 0,
          height: mobile ? "calc(100vh - var(--app-header-height))" : "100vh",
          overflow: "hidden",
          zIndex: 101,
        }}
      >
        <div className="sidebar-inner" id="app-navigation">
          <Tooltip title={collapsed ? "Practica" : null} placement="right">
            <Link
              to="/home"
              className="sidebar-brand"
              aria-label={`Practica · ${t("Home")}`}
              onClick={() => mobile && closeDrawer()}
            >
              <span className="sidebar-brand-mark" aria-hidden="true">
                <ReadOutlined />
              </span>
              {!collapsed && (
                <span className="sidebar-brand-name">Practica</span>
              )}
            </Link>
          </Tooltip>
          <MenuList
            collapsed={collapsed}
            onNavigate={() => mobile && closeDrawer()}
          />
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          className={`sidebar-header${editingWorksheet ? " sidebar-header--editor" : ""}`}
          style={{
            position: "fixed",
            top: 0,
            left: sidebarWidth,
            right: 0,
            height: "var(--app-header-height)",
            padding: "0 16px",
            background: "#ffffff",
            zIndex: 100,
            transition: "left 0.2s",
          }}
        >
          <Button
            ref={toggleRef}
            type="text"
            className="sidebar-toggle"
            aria-label={t(collapsed ? "Open navigation" : "Close navigation")}
            aria-expanded={!collapsed}
            aria-controls="app-navigation"
            onClick={toggleNavigation}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          />
          {editingWorksheet ? (
            <div className="worksheetToolbarHost" ref={setToolbarHost} />
          ) : (
            <>
              <span className="sidebar-page-name">{t(pageName)}</span>
              <LanguageButton inline />
            </>
          )}
        </Header>

        <Content
          style={{
            marginTop: "var(--app-header-height)",
            minHeight: "calc(100vh - var(--app-header-height))",
            padding: mobile ? 16 : 24,
          }}
        >
          <EditorHeaderContext.Provider value={toolbarHost}>
            {children}
          </EditorHeaderContext.Provider>
        </Content>
        {mobile && !collapsed && (
          <button
            className="sidebarBackdrop"
            style={{ top: "var(--app-header-height)" }}
            aria-label={t("Close navigation")}
            onClick={closeDrawer}
          />
        )}
      </Layout>
    </Layout>
  );
}

export default LeftSidebar;
