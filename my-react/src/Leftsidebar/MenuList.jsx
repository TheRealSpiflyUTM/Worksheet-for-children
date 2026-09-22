import { Menu, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";

import {
    HomeOutlined,
    AreaChartOutlined,
    SettingOutlined,
    BarsOutlined,
    AppstoreOutlined,
    ReadOutlined,
} from "@ant-design/icons";

function MenuList() {
    const navigate = useNavigate();

    return (
        <ConfigProvider
            theme={{
                components: {
                    Menu: {
                        itemBg: "rgb(39, 55, 77)",
                        itemColor: "rgb(221, 230, 237)",

                        itemHoverBg: "rgb(82, 109, 130)",
                        itemHoverColor: "rgb(221, 230, 237)",

                        itemSelectedBg: "rgb(157, 178, 191)",
                        itemSelectedColor: "rgb(39, 55, 77)",
                        itemBorderRadius: 3,
                    },
                },
            }}
        >
            <Menu mode="inline" className="menu-bar">

                <Menu.Item
                    key="home"
                    icon={<HomeOutlined />}
                    onClick={() => navigate("/home")}
                >
                    Home
                </Menu.Item> 

                {/* <Menu.Item
                    key="activity"
                    icon={<AppstoreOutlined />}
                    onClick={() => navigate("/activity")}
                >
                    Activity
                </Menu.Item> */}

                <Menu.Item
                    key="subtasks"
                    icon={<BarsOutlined />}
                >
                    Tasks
                </Menu.Item>

                <Menu.Item
                    key="progress"
                    icon={<AreaChartOutlined />}
                >
                    Progress
                </Menu.Item>

                <Menu.Item
                    key="workSheet"
                    icon={<ReadOutlined />}
                    onClick={() => navigate("/sheets")}
                >
                    WorkSheets
                </Menu.Item>

                <Menu.Item
                    key="kids"
                    icon={<ReadOutlined />}
                    onClick={() => navigate("/kids")}
                >
                    Kids
                </Menu.Item>

                <Menu.Item
                    key="teacher"
                    icon={<ReadOutlined />}
                    onClick={() => navigate("/teacher")}
                >
                    Teacher
                </Menu.Item>

                <Menu.Item
                    key="setting"
                    icon={<SettingOutlined />}
                >
                    Settings
                </Menu.Item>

            </Menu>
        </ConfigProvider>
    );
}

export default MenuList;