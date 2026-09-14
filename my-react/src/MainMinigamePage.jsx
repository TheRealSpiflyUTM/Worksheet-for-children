import ColorMinigameKidsVersion from "./ElevPerspective/ColorMinigame/ColorMinigame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import React, {useState, useRef} from 'react';

import "./MainMinigamePage.css";

function MainMinigamePage(){
  const avaliableMinigames = [
    {name: "Color Game", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game1", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game2", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game3", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game4", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game5", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game6", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game7", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game8", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game9", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},
    {name: "Color Game0", minigame: <ColorMinigameKidsVersion letter="u"/>, img:"/img/ColorGame.png"},

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
      />

    </main>
  </>);
}

export default MainMinigamePage