import { ConfigProvider } from "antd";
import enGB from "antd/locale/en_GB";
import roRO from "antd/locale/ro_RO";
import { Route, Routes, useLocation } from "react-router-dom";

import MainMinigamePage from "./WorkSheet/MainMinigamePage.jsx";
import WorkSheetViewer from "./WorkSheet/WorkSheetViewer.jsx";

import CodeLogin from "../pin login/codelogin.jsx";
import AuthExample from "./Auth/Login.jsx";
import AuthButtons from "../AuthButtons/AuthButtons.jsx";
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";
import SignUp from "./Auth/SignUp.jsx";

import KidPage from "./Home/kids/KidPage.jsx";
import TestPage from "./Home/kidstests/TestPage.jsx";
import LegacyClassEntry from "./Home/LegacyClassEntry.jsx";
import { usePlatform } from "./platform/PlatformState.js";
import { PlatformProvider } from "./platform/PlatformContext.jsx";
import { RequireSession } from "./platform/PlatformUI.jsx";
import {
  AssignmentsPage,
  AssignmentDetailPage,
  AccountPage,
  ClassesPage,
  ClassDetailPage,
  DashboardPage,
  LanguageButton,
  LegacyWorksheetEntry,
} from "./platform/PlatformPages.jsx";
import AttemptPage from "./platform/AttemptPage.jsx";
import TeacherAssignments from "./platform/TeacherAssignments.jsx";
import "./platform/Platform.css";

function AttemptRoute() {
  const { user } = usePlatform();
  return (
    <RequireSession entry="/">
      {user?.role === "USER" ? (
        <div className="child-game-page">
          <AttemptPage />
        </div>
      ) : (
        <LeftSidebar>
          <AttemptPage />
        </LeftSidebar>
      )}
    </RequireSession>
  );
}

function AppContent() {
  const location = useLocation();
  const { language, user } = usePlatform();

  const showPinLogin = location.pathname === "/";
  const showAuthButtons =
    ["/", "/login", "/signup"].includes(location.pathname) ||
    (user?.role === "USER" && location.pathname.startsWith("/attempts/"));

  return (
    <ConfigProvider
      locale={language === "ro" ? roRO : enGB}
      theme={{
        token: {
          colorPrimary: "#6c5ce7",
          colorInfo: "#37a7e8",
          colorSuccess: "#26b979",
          colorWarning: "#ffb703",
          colorError: "#f04472",
          borderRadius: 14,
          fontFamily: '"Geist Variable", "Trebuchet MS", sans-serif',
        },
        components: {
          Button: {
            borderRadius: 14,
            controlHeight: 44,
            fontWeight: 700,
          },
          Input: {
            borderRadius: 14,
            controlHeight: 48,
          },
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
        <Route path="/login" element={<AuthExample />} />

        <Route
          path="/home"
          element={
            <LeftSidebar>
              <RequireSession>
                <DashboardPage />
              </RequireSession>
            </LeftSidebar>
          }
        />
        <Route
          path="/home/:className"
          element={
            <RequireSession teacherOnly>
              <LegacyClassEntry />
            </RequireSession>
          }
        />

        <Route
          path="/home/:className/:kidName"
          element={
            <LeftSidebar>
              <RequireSession teacherOnly>
                <LegacyClassEntry />
              </RequireSession>
            </LeftSidebar>
          }
        />

        {/* <Route
          path="/kids"
          element={<MainMinigamePage isTeacher={false} />}
        /> */}
        {/* SIGN UP */}
        <Route path="/signup" element={<SignUp />} />

        {/* ACCOUNT */}
        <Route
          path="/account"
          element={
            <LeftSidebar>
              <RequireSession>
                <AccountPage />
              </RequireSession>
            </LeftSidebar>
          }
        />

        {/* WORKSHEETS */}
        <Route
          path="/sheets"
          element={
            <LeftSidebar>
              <RequireSession teacherOnly>
                <WorkSheetViewer />
              </RequireSession>
            </LeftSidebar>
          }
        />

        {/* TEACHER */}
        <Route
          path="/teacher/:worksheetId"
          element={
            <LeftSidebar>
              <RequireSession teacherOnly>
                <MainMinigamePage isTeacher={true} />
              </RequireSession>
            </LeftSidebar>
          }
        />

        {/* KIDS */}
        <Route
          path="/kids/:worksheetId"
          element={
            <LeftSidebar>
              <RequireSession>
                <LegacyWorksheetEntry />
              </RequireSession>
            </LeftSidebar>
          }
        />

        <Route
          path="/classes"
          element={
            <LeftSidebar>
              <RequireSession>
                <ClassesPage />
              </RequireSession>
            </LeftSidebar>
          }
        />

        <Route
          path="/classes/:id"
          element={
            <LeftSidebar>
              <RequireSession>
                <ClassDetailPage />
              </RequireSession>
            </LeftSidebar>
          }
        />

        <Route
          path="/assignments"
          element={
            <LeftSidebar>
              <RequireSession>
                <AssignmentsPage />
              </RequireSession>
            </LeftSidebar>
          }
        />

        <Route
          path="/assignments/classes/:classId"
          element={
            <LeftSidebar>
              <RequireSession teacherOnly>
                <TeacherAssignments />
              </RequireSession>
            </LeftSidebar>
          }
        />
        <Route
          path="/assignments/classes/:classId/worksheets/:revisionId"
          element={
            <LeftSidebar>
              <RequireSession teacherOnly>
                <TeacherAssignments />
              </RequireSession>
            </LeftSidebar>
          }
        />
        <Route
          path="/assignments/:id"
          element={
            <LeftSidebar>
              <RequireSession>
                <AssignmentDetailPage />
              </RequireSession>
            </LeftSidebar>
          }
        />

        <Route
          path="/classes/:id/children/:userId"
          element={
            <LeftSidebar>
              <RequireSession teacherOnly>
                <KidPage />
              </RequireSession>
            </LeftSidebar>
          }
        />

        <Route
          path="/classes/:id/children/:userId/tests/:attemptId"
          element={
            <LeftSidebar>
              <RequireSession teacherOnly>
                <TestPage />
              </RequireSession>
            </LeftSidebar>
          }
        />

        <Route path="/attempts/:id" element={<AttemptRoute />} />
      </Routes>
      {showAuthButtons && <LanguageButton inline />}
    </ConfigProvider>
  );
}

function App() {
  return (
    <PlatformProvider>
      <AppContent />
    </PlatformProvider>
  );
}

export default App;
