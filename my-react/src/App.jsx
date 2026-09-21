import { ConfigProvider } from "antd";
import { Navigate, Route, Routes } from "react-router-dom";
import MainMinigamePage from "./WorkSheet/MainMinigamePage.jsx";
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";
import WorkSheetViewer from "./WorkSheet/WorkSheetViewer.jsx";
import AvatarExample from "./Avatar/Avatar.jsx";
import AuthExample from "./Auth/Auth.jsx";
import Login from "../pin login/login.jsx";

function App() {
return (
<ConfigProvider
theme={{
token: {
colorPrimary: "rgb(14, 71, 161)",
},
}}
> <div> <LeftSidebar> <AvatarExample />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/teacher" />}
        />

        <Route
          path="/activity"
          element={<Login />}
        />

        <Route
          path="/auth"
          element={<AuthExample />}
        />

        <Route
          path="/teacher"
          element={<MainMinigamePage isTeacher={true} />}
        />

        <Route
          path="/kids"
          element={<MainMinigamePage isTeacher={false} />}
        />

        <Route
          path="/sheets"
          element={<WorkSheetViewer />}
        />
      </Routes>
    </LeftSidebar>
  </div>
</ConfigProvider>

);
}

export default App;
