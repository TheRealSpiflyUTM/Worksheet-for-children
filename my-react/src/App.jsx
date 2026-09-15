import { useState } from "react";
import MainMinigamePage from "./MainMinigamePage.jsx";
import ButtonKT from "./Buttons/Buttons.jsx";
import LeftSidebar from "./Leftsidebar/LeftSideBar.jsx";

function App() {
  const [isTeacher , setIsTeacher] = useState(true);
  return(
    <>
      <LeftSidebar/>
      <MainMinigamePage isTeacher= {isTeacher}/>
      <ButtonKT isTeacher= {isTeacher} setIsTeacher= {setIsTeacher}/>
      
    </>
  );
}


export default App;
