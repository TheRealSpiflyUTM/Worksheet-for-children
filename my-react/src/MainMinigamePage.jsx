import ColorMinigame from "./ColorMinigame/ColorMinigame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import React, {useState, useRef} from 'react';

import "./MainMinigamePage.css";

function MainMinigamePage(){
  const avaliableMinigames = [{name: "Color Game", minigame: <ColorMinigame/>, img:"/img/ColorGame.png"}];
  const [isAddMinigameOpen , setIsAddMinigameOpen] = useState(false);
  const addeMinigames = []  ;

  return(<>
    <main className="main-minigame-page">
    {addeMinigames.length == 0 ? <button className= "fistAddMinigameButton" onClick={() => setIsAddMinigameOpen(true)}>Add Minigame</button> : null}

    <AddMinigameWindow 
      open = {isAddMinigameOpen} 
      closeFuntion={() => setIsAddMinigameOpen(false)}
      game = {{name: avaliableMinigames[0].name , img: avaliableMinigames[0].img}}    
      />
    <h1>Sahsah</h1>
      <ColorMinigame letter="u"/>
    </main>
  </>);
}

export default MainMinigamePage