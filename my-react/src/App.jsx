import { ConfigProvider } from "antd";
import { Route, Routes, useLocation } from "react-router-dom";

import MainMinigamePage from "./WorkSheet/MainMinigamePage.jsx";
import WorkSheetViewer from "./WorkSheet/WorkSheetViewer.jsx";

import CodeLogin from "../pin login/codelogin.jsx";
import AuthExample from "./Auth/Auth.jsx";
import AuthButtons from "../AuthButtons/AuthButtons.jsx";
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";
import Avatar from "./Avatar/Avatar.jsx";

function App() {
const location = useLocation();

const showPinLogin = location.pathname === "/";
const showAuthButtons = location.pathname !== "/account";

return (
    <ConfigProvider
        theme={{
            token: {
                colorPrimary: "rgb(14, 71, 161)",
            },
        }}
    >
        {showAuthButtons && <AuthButtons />}

        <Routes>

            {/* HOME */}
            <Route
                path="/"
                element={
                    <>
                        <MainMinigamePage isTeacher={false} />
                        {showPinLogin && <CodeLogin />}
                    </>
                }
            />

            {/* LOGIN */}
            <Route
                path="/login"
                element={<AuthExample />}
            />

            {/* SIGN UP */}
            <Route
                path="/signup"
                element={<AuthExample />}
            />

            {/* ACCOUNT */}
            <Route
                path="/account"
                element={
                    <LeftSidebar>
                        <Avatar />
                    </LeftSidebar>
                }
            />

            {/* WORKSHEETS */}
            <Route
                path="/sheets"
                element={
                    <LeftSidebar>
                        <Avatar />
                        <WorkSheetViewer />
                    </LeftSidebar>
                }
            />

            {/* TEACHER */}
            <Route
                path="/teacher"
                element={
                    <LeftSidebar>
                        <Avatar />
                        <MainMinigamePage isTeacher={true} />
                    </LeftSidebar>
                }
            />

            {/* KIDS */}
            <Route
                path="/kids"
                element={
                    <LeftSidebar>
                        <Avatar />
                        <MainMinigamePage isTeacher={false} />
                    </LeftSidebar>
                }
            />

        </Routes>
    </ConfigProvider>
);

}

export default App;
