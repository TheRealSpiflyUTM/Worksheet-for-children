import React, {useState, useRef} from 'react';
import WidgetT from "./WidgetT.jsx";
import WidgetK from "./WidgetK.jsx";
import './ColorMinigame.css';
function ColorMinigame(params){
  // Values at the top

  const [letter, changeLetter] = useState("u");
  const [animals, changeAnimals] = useState([
    {name: "Urs" ,     img: "/img/BearImg.webp"}, 
    {name: "Vulpe" ,   img: "/img/FoxImg.webp"},
    {name: "Lup",      img: "/img/WolfImg.webp",},
  ]);

  // Functions here
  function changeAnimalName(animalIndex, newName) {
    if(newName.length >= 15) return;
    changeAnimals((currentAnimals) =>
      currentAnimals.map((animal, index) =>
        index === animalIndex
          ? { ...animal, name: newName }
          : animal
      )
    );
  }
  if(params.isTeacher){
    return(
      <>
        <div className="minigame addBorder">
          <h2 className="titleText">{`Apasa pe bulina corespunzatoare sunetului "${letter.toUpperCase()}"`}</h2>
            <div className="widgets">
              {animals.map((animal, index) =>(
                  <WidgetT key={index} img={animal.img} name={animal.name} letter={letter} onNameChange={(newName) => changeAnimalName(index, newName)}  />
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
        <h2 className="titleText">{`Apasa pe bulina coresbunzatoare sunetului "${letter.toUpperCase()}"`}</h2>
          <div className="widgets">
            {animals.map((animal, index) =>(
                <WidgetK key={index} img={animal.img} name={animal.name} letter={letter} />
            ))}
          </div>
      </div>
    </>
    );
  }
}

export default ColorMinigame;