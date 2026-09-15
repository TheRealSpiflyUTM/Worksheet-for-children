import { useState } from "react";
import {Navigate , Route , Routes} from "react-router-dom"
import MainMinigamePage from "./MainMinigamePage.jsx";
import PerspectiveNavigation from "./Buttons/Buttons.jsx";
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";

function App() {
  return(
    <div>
      
      <PerspectiveNavigation/>
      <LeftSidebar />
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
          
        />

      </Routes>
    </div>
  );
}


export default App
