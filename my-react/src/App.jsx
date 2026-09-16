import { useState } from "react";
import {Navigate , Route , Routes} from "react-router-dom"
import MainMinigamePage from "./MainMinigamePage.jsx";
import PerspectiveNavigation from "./Buttons/Buttons.jsx";
<<<<<<< HEAD
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";
=======
<<<<<<< HEAD
=======
import All from "./Base/All.jsx";
>>>>>>> origin/main
>>>>>>> origin/main

function App() {
  return(
    <div>
<<<<<<< HEAD
      
      <PerspectiveNavigation/>
      <LeftSidebar />
=======
      <PerspectiveNavigation/>

>>>>>>> origin/main
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
<<<<<<< HEAD
        
        
=======
<<<<<<< HEAD

=======
        
        <Route
          path="/auth"
          element={
            <All/>}
        />
>>>>>>> origin/main
>>>>>>> origin/main

      </Routes>
    </div>
  );
}


export default App
