import { useState } from 'react';
import { Button, Layout, theme } from "antd";
import MenuList from './MenuList';
import "./LeftSidebar.css";
import {  MenuUnfoldOutlined, 
          MenuFoldOutlined,  
          MenuOutlined,  
      } from '@ant-design/icons';


const { Header, Sider } = Layout;
function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: {colorBgContainer},
  } = theme.useToken();
  return(

      <Layout>
        <Sider collapsed={collapsed}
        collapsible
        trigger={null}
        className="sidebar">
          <MenuList />
        </Sider>
        <Layout>
          <Header style={{padding: 0, background: colorBgContainer}}>
            <Button type='text' 
            className='toggle'
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? 
            <MenuUnfoldOutlined /> : 
            <MenuFoldOutlined/>
            } 
            /> 
            
          </Header>
        </Layout>
      </Layout>
      )
}

export default LeftSidebar;
