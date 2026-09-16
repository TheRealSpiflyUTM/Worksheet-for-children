import { Menu } from "antd";
import {HomeOutlined, 
        AppstoreAddOutlined,
        AreaChartOutlined,
        PayCircleOutlined,
        SettingOutlined, 
        BarsOutlined,
        AppstoreOutlined,
        ReadOutlined,     

} from '@ant-design/icons'

function MenuList(params) {
    return(
        <Menu theme="dark" mode="inline" className='menu-bar'>
            <Menu.Item key="home" icon={<HomeOutlined />}>
                Home
            </Menu.Item>
            <Menu.Item key="activity" icon={<AppstoreOutlined />}>
                Activity
            </Menu.Item>
            <Menu.Item key="subtasks" icon={<BarsOutlined />}>
                Tasks
            </Menu.Item>
            {/* <Menu.SubMenu key='subtasks' icon={<BarsOutlined />} 
            title="Tasks">
                <Menu.Item key='task-1'>Task 1</Menu.Item>
                <Menu.Item key='task-2'>Task 2</Menu.Item>
                <Menu.SubMenu key='subtasks' title='Subtasks'>
                    <Menu.Item key='subtask-1'>Subtask 1</Menu.Item>
                    <Menu.Item key='subtask-2'>Subtask 2</Menu.Item>
                </Menu.SubMenu>
            </Menu.SubMenu> */}
            <Menu.Item key="progress" icon={<AreaChartOutlined />}>
                Progress
            </Menu.Item>
            <Menu.Item key="payment" icon={<PayCircleOutlined />}>
                Payment
            </Menu.Item>
            <Menu.Item key="setting" icon={<SettingOutlined />}>
                Settings
            </Menu.Item>
            <Menu.Item key="workSheet" icon={<ReadOutlined />}>
                WorkSheets
            </Menu.Item>
        </Menu>
    )
}

export default MenuList;