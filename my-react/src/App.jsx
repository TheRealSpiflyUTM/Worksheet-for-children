import { useState } from "react";
import {Navigate , Route , Routes} from "react-router-dom"
import MainMinigamePage from "./WorkSheet/MainMinigamePage.jsx";
import PerspectiveNavigation from "./Buttons/Buttons.jsx";
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";
import WorkSheetViewer from "./WorkSheet/WorkSheetViewer.jsx";

function App() {
  return(
    <div>

      <LeftSidebar>
        <PerspectiveNavigation/>

        <Routes>
          <Route 
          path="/"
          element= {<Navigate to="/teacher" replace />}
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
