// K is for kids 
// T is for teacher
// We will use this to swich between teacher and student Version 

import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import React, {useState, useRef} from 'react';

import "./MainMinigamePage.css"; 

function MainMinigamePage(params){

  const avaliableMinigames = [
    {id: "color-game", name: "Color Game", img:"/img/ColorGame.png"},
  ];
  
  const [isAddMinigameOpen , setIsAddMinigameOpen] = useState(false);
  const [addedMinigames, setAddeMinigames] = useState([]);


  const addMinigameFunction = (game) =>{
    setAddeMinigames((currentGame) => [...currentGame, game]);
    setIsAddMinigameOpen(false);
  };

  return(<>
    <main className="main-minigame-page">
    {addedMinigames.length == 0 ? 
      <button className= "fistAddMinigameButton" onClick={() => setIsAddMinigameOpen(true)}>Add Minigame</button> 
      :
      <div className="addedGames">
        {addedMinigames.map((game , index) =>(
          <div key= {`${game.id}-${index}`}>
            {game.id === "color-game" && (
              <ColorMinigame isTeacher={params.isTeacher} />
            )}
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