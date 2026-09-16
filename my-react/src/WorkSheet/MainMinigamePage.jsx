// K is for kids 
// T is for teacher
// We will use this to swich between teacher and student Version 

import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import React, {useState, useRef} from 'react';

import "./MainMinigamePage.css"; 

function MainMinigamePage(params){

  const avaliableMinigames = [
    {
      id: "color-game",
      name: "Color Game",
      img: "/img/ColorGame.png",
      letter: "u",

      animals: [
        {
          id: "bear",
          name: "Urs",
          img: "/img/BearImg.webp",
        },
        {
          id: "fox",
          name: "Vulpe",
          img: "/img/FoxImg.webp",
        },
        {
          id: "wolf",
          name: "Lup",
          img: "/img/WolfImg.webp",
        },
      ],
    },
  ];
  
  const [isAddMinigameOpen , setIsAddMinigameOpen] = useState(false);
  const [addedMinigames, setAddeMinigames] = useState([]);

  const addMinigameFunction = (game) =>{
    const newGame = {
      ...game,
      instanceId: crypto.randomUUID(),
      animals: game.animals.map((animal) =>({
        ...animal,
      })),
    };

    setAddeMinigames((currentGame) => [...currentGame, newGame]);
    setIsAddMinigameOpen(false);
  };

  function updateMinigame(instanceId , updatedGame){
    setAddeMinigames((currentGame) => currentGame.map((game) => game.instanceId === instanceId ? updatedGame : game));
  }

  if(params.isTeacher){
    return(<div>
      <main className="main-minigame-page">
      {addedMinigames.length == 0 ? 
        <button className= "fistAddMinigameButton" onClick={() => setIsAddMinigameOpen(true)}>Add Minigame</button> 
        :
        <div className="addedGames">

          {addedMinigames.map((game , index) =>(
            <div key= {`${game.id}-${index}`}>
              {game.id === "color-game" && (
                <ColorMinigame 
                isTeacher={params.isTeacher}
                game = {game}
                onGameChange={(updatedGame) =>
                  updateMinigame(
                    game.instanceId,
                    updatedGame,
                  )}
                />
              )}
            </div>
          ))}
          <button className= "fistAddMiniga meButton" onClick={() => setIsAddMinigameOpen(true)}>Add Minigame</button>
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
    </div>);
  }
  else {
    return (
      <main className="main-minigame-page">
        <div className="addedGames">
          {addedMinigames.map((game) => (
            <div key={game.instanceId}>
              {game.id === "color-game" && (
                <ColorMinigame
                  isTeacher={false}
                  game={game}
                />
              )}
            </div>
          ))}
        </div>
      </main>
    );
  }
}

export default MainMinigamePage