import { useState } from "react";
import MainMinigamePage from "./MainMinigamePage.jsx";
import ButtonKT from "./Buttons/Buttons.jsx";
import All from "./Base/All.jsx";

function App() {
  const [isTeacher , setIsTeacher] = useState(true);
  return(
    <>
      <ButtonKT isTeacher= {isTeacher} setIsTeacher= {setIsTeacher}/>
      <MainMinigamePage isTeacher= {isTeacher}/>
      <All/>
    </>
  );
}


export default App;
