import { useState } from "react";
import { Button, Layout, theme } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import MenuList from "./MenuList";
import "./LeftSidebar.css";

const { Header, Sider, Content } = Layout;

const SIDEBAR_EXPANDED_WIDTH = 200;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const HEADER_HEIGHT = 64;

function LeftSidebar({ children }) {
  const [collapsed, setCollapsed] = useState(true);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const sidebarWidth = collapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_EXPANDED_WIDTH;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={SIDEBAR_EXPANDED_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        collapsed={collapsed}
        collapsible
        trigger={null}
        className="sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 101,
        }}
      >
        <MenuList />
      </Sider>

      <Layout
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
    style={{
        position: "fixed",
        top: 0,
        left: sidebarWidth,
        right: 0,
        height: HEADER_HEIGHT,
        padding: 0,
        background: colorBgContainer,
        zIndex: 100,
        transition: "left 0.2s",
    }}
>
    <Button
        type="text"
        className="toggle"
        onClick={() => setCollapsed(!collapsed)}
        icon={
            collapsed
                ? <MenuUnfoldOutlined />
                : <MenuFoldOutlined />
        }
    />
</Header>


        <Content
          style={{
            marginTop: HEADER_HEIGHT,
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
            padding: 24,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default LeftSidebar;