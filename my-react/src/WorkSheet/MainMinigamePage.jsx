// K is for kids 
// T is for teacher
// We will use this to swich between teacher and student Version 

import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

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

  const [selectedGameId, setSelectedGameId] = useState(null);
  const [isAddMinigameOpen , setIsAddMinigameOpen] = useState(false);
  const [addedMinigames, setAddeMinigames] = useState([]);

  const selectedAreaRef = useRef(null);

  const addMinigameFunction = (game) =>{
    const newGame = {
      ...game,
      instanceId: crypto.randomUUID(),
      animals: game.animals.map((animal) =>({
        ...animal,
      })),
    };
    
    setAddeMinigames((currentGames) => {

      if(currentGames.length === 0) return [newGame];

      const selectedIndex = currentGames.findIndex(
        (currentGame) => currentGame.instanceId === selectedGameId
      );
      console.log(selectedIndex);
      if(selectedIndex === -1) return [...currentGames, newGame];

      const updatedGames = [...currentGames];

      updatedGames.splice(selectedIndex + 1, 0 , newGame);

      return updatedGames;
    });

    setSelectedGameId(newGame.instanceId);
    setIsAddMinigameOpen(false);
  };

  function updateMinigame(instanceId , updatedGame){
    setAddeMinigames((currentGame) => currentGame.map((game) => game.instanceId === instanceId ? updatedGame : game));
  } 

  
useEffect(() => {
  function handleClickAway(event) {
    if(isAddMinigameOpen){
      return;
    }
    if (
      selectedAreaRef.current &&
      !selectedAreaRef.current.contains(event.target)
    ) {
      setSelectedGameId(null);
    }
  }

  document.addEventListener("pointerdown", handleClickAway);

  return () => {
    document.removeEventListener("pointerdown", handleClickAway);
  };
}, [isAddMinigameOpen]);


  if(params.isTeacher){
    return(<div>
      <main className="main-minigame-page">
      {addedMinigames.length === 0 ? (
        <Button
          className="firstAddMinigameButton"
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsAddMinigameOpen(true)}
        >
          Add Minigame
        </Button>
      )
        :<div className="addedGames" >
          <div ref={selectedAreaRef} className="addedGames">
            {addedMinigames.map((game , index) =>(
              <div
                className={selectedGameId === game.instanceId ?
                    "addBorder selectedGame"
                  : "addBorder"
                } 
                key= {`${game.instanceId}`}
                onClick={() => setSelectedGameId(game.instanceId)}
              >
                {game.id === "color-game" && (
                  <ColorMinigame 
                    isTeacher={params.isTeacher}
                    game = {game}
                    onGameChange={(updatedGame) =>
                      updateMinigame(game.instanceId, updatedGame)
                    }
                  />
                )}
                
                {selectedGameId === game.instanceId && (
                  <Button
                    className="addMinigameButton"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddMinigameOpen(true)}
                  >
                    Add Minigame
                  </Button>
                )}

              </div>
            ))}
          </div>
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
