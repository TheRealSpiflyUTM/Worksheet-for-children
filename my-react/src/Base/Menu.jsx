import React, { useState } from 'react';
import {
  AppstoreOutlined,
  ContainerOutlined,
  DesktopOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  TeamOutlined,
} from '@ant-design/icons';

import { Button, Menu } from 'antd';
import './Menu.css'



const items = [
  { key: '1', icon: <HomeOutlined />, label: 'Home' },
  { key: '2', icon: <TeamOutlined />, label: 'Classes' },
  {
      key: 'sub1',
      label: 'Enrolled',
      icon: <MailOutlined />,
      children: [
          { key: '3', label: 'Option 5' },
          { key: '4', label: 'Option 6' },
          
        ],
    },
    // { key: '5', icon: <ContainerOutlined />, label: '' },
    // { key: '6', icon: <ContainerOutlined />, label: 'Option 4' },
    
];

const MenuExample = () => {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div style={{ width: 256 }}>
      <Button className="menu-button" type="primary" onClick={toggleCollapsed} style={{ marginBottom: 20 }}>
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </Button>
      <Menu
        triggerSubMenuAction="click"
        className = "custom-menu"
        defaultSelectedKeys={['1']}
        mode="inline"
        theme="dark"
        inlineCollapsed={collapsed}
        items={items}
      />
    </div>
  );
};

export default MenuExample;