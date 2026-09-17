import { useState } from "react";
import {Navigate , Route , Routes} from "react-router-dom"
import MainMinigamePage from "./WorkSheet/MainMinigamePage.jsx";
<<<<<<< HEAD
=======
// import PerspectiveNavigation from "./Buttons/Buttons.jsx";
>>>>>>> origin/main
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";
import WorkSheetViewer from "./WorkSheet/WorkSheetViewer.jsx";
import AvatarExample from "./Avatar/Avatar.jsx";
import AuthExample from "./Auth/Auth.jsx";

function App() {
  return(
    <div>

      <LeftSidebar>
<<<<<<< HEAD

=======
        <AvatarExample />
>>>>>>> origin/main
        <Routes>

          <Route 
          path="/"
          element= {<Navigate to="/teacher"  />}
          />

          <Route
          path="/auth"
          element={<AuthExample />}
          />

          <Route
            path="/teacher"
            element={
              <MainMinigamePage isTeacher={true}/>}
          />
          
          <Route
            path="/kids"
            element={
              <MainMinigamePage isTeacher={false}/>}
          />

          <Route
            path="/sheets"
            element={
              <WorkSheetViewer/>}
          />
          
        </Routes>
      </LeftSidebar>
    </div>
  );
}


export default App
