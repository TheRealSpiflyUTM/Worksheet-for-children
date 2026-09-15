import { useState } from "react";
import MainMinigamePage from "./MainMinigamePage.jsx";
import ButtonKT from "./Buttons/Buttons.jsx";
import Button1 from "./Buttons/Buttons.jsx";
import All from "./Base/All.jsx";

function App() {
  const [isTeacher , setIsTeacher] = useState(true);
  return(
    <>
      <ButtonKT isTeacher= {isTeacher} setIsTeacher= {setIsTeacher}/>
      <MainMinigamePage isTeacher= {isTeacher}/>
      <MainMinigamePage/>
      <Button1/>
      <All/>
    </>
  );
}


export default App
