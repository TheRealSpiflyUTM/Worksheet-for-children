import { Menu, ConfigProvider } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { usePlatform } from "../platform/PlatformState.js";

export default function MenuList({ collapsed, onNavigate }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, user } = usePlatform();
  const teacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const routes = [
    { key: "/home", icon: <HomeOutlined />, label: t("Home") },
    ...(teacher
      ? [{ key: "/sheets", icon: <ReadOutlined />, label: t("Worksheets") }]
      : []),
    { key: "/classes", icon: <TeamOutlined />, label: t("Classes") },
    {
      key: "/assignments",
      icon: <ReadOutlined />,
      label: t("Assignments"),
    },
  ];
  const account = {
    key: "/account",
    icon: <UserOutlined />,
    label: t("Account"),
  };
  const selected = pathname.startsWith("/teacher/")
    ? "/sheets"
    : [...routes, account].find(
        (route) =>
          pathname === route.key || pathname.startsWith(route.key + "/"),
      )?.key;
  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemBg: "#ffffff",
            itemColor: "#243047",
            itemHoverBg: "#f5f3ff",
            itemHoverColor: "#6c5ce7",
            itemSelectedBg: "#eeeafe",
            itemSelectedColor: "#6c5ce7",
            itemBorderRadius: 12,
            itemHeight: 46,
            itemMarginInline: 0,
            itemMarginBlock: 6,
            iconSize: 20,
            collapsedWidth: 56,
          },
        },
      }}
    >
      <nav className="sidebar-navigation" aria-label={t("Main navigation")}>
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          className="sidebar-menu sidebar-menu--main"
          items={routes}
          selectedKeys={selected ? [selected] : []}
          onClick={({ key }) => {
            navigate(key);
            onNavigate?.();
          }}
        />
        <div className="sidebar-footer">
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            className="sidebar-menu"
            items={[account]}
            selectedKeys={selected ? [selected] : []}
            onClick={({ key }) => {
              navigate(key);
              onNavigate?.();
            }}
          />
        </div>
      </nav>
    </ConfigProvider>
  );
}
