import { useState } from "react";
import {Navigate , Route , Routes} from "react-router-dom"
import MainMinigamePage from "./MainMinigamePage.jsx";
import PerspectiveNavigation from "./Buttons/Buttons.jsx";
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";

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
          
        </Routes>
      </LeftSidebar>
    </div>
  );
}


export default App
