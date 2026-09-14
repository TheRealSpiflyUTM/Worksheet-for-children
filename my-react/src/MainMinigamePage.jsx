// K is for kids 
// T is for teacher
// We will use this to swich between teacher and student Version 

import ColorMinigameK from "./ElevPerspective/ColorMinigame/ColorMinigame.jsx";
import ColorMinigameT from "./TeacherPerspective/ColorMinigame/ColorMinigame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import React, {useState, useRef} from 'react';

import "./MainMinigamePage.css"; 

function MainMinigamePage(){
  const avaliableMinigames = [
    {name: "Color Game",  minigame: <ColorMinigameT letter="u"/>, img:"/img/ColorGame.png"},

  ];
  const [isAddMinigameOpen , setIsAddMinigameOpen] = useState(false);
  const [addedMinigames, setAddeMinigames] = useState([]);


  const addMinigameFunction = (game) =>{
    setAddeMinigames([...addedMinigames, game]);
    setIsAddMinigameOpen(false);
  };

  return(<>
    <main className="main-minigame-page">
    {addedMinigames.length == 0 ? 
      <button className= "fistAddMinigameButton" onClick={() => setIsAddMinigameOpen(true)}>Add Minigame</button> 
      :
      <div className="addedGames">
        {addedMinigames.map((game , index) =>(
          <div key= {index}>
            {game.minigame}
          </div>
        ))}
        <button className= "fistAddMinigameButton" onClick={() => setIsAddMinigameOpen(true)}>Add Minigame</button>
      </div>
    }



    {/* Nu atinge ea isi da load cand apesi butonul de addMinigame */}
    <AddMinigameWindow
      open = {isAddMinigameOpen} 
      closeFuntion={() => setIsAddMinigameOpen(false)}
      games = {avaliableMinigames}
      addMinigame= {addMinigameFunction}
      />

    </main>
  </>);
}

export default MainMinigamePage