import React, {useState, useRef} from 'react';
import WidgetT from "./WidgetT.jsx";
import WidgetK from "./WidgetK.jsx";
import './ColorMinigame.css';
function ColorMinigame(params){
  // Values at the top
  const animals = params.game.animals;
  const letter = params.game.letter;

  // Functions here
  function changeAnimalName(animalId, newName) {
    if(newName.length >= 15) return;

    const updatedGame = {
      ...params.game,
      
      animals: params.game.animals.map((animal) =>{
        return (animal.id === animalId ? {...animal , name: newName} : animal);
      })
    };
    
    params.onGameChange(updatedGame);
  }

  // Kid / Teacher Change
  if(params.isTeacher){
    return(
      <>
        <div className="minigame addBorder">
          <h2 className="titleText">{`Apasa pe bulina corespunzatoare sunetului "${letter.toUpperCase()}"`}</h2>
            <div className="widgets">
              {animals.map((animal, index) =>(
                  <WidgetT 
                  key={animal.id} 
                  img={animal.img} 
                  name={animal.name} 
                  letter={letter} 
                  onNameChange={(newName) => changeAnimalName(animal.id, newName)}  />
              ))}
            </div>
        </div>
      </>
    );
  }
  else{
    return(
    <>
      <div className="minigame addBorder">
        <h2 className="titleText">{`Apasa pe bulina corespunzatoare sunetului "${letter.toUpperCase()}"`}</h2>
          <div className="widgets">
            {animals.map((animal, index) =>(
                <WidgetK 
                key={animal.id} 
                img={animal.img} 
                name={animal.name} 
                letter={letter}
                />
            ))}
          </div>
      </div>
    </>
    );
  }
}

export default ColorMinigame;