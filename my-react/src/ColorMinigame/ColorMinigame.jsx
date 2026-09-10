import React, {useState, useRef} from 'react';
import Widget from "./Widget.jsx";
import './ColorMinigame.css';
function ColorMinigame(params){
  const [animals, changeAnimals] = useState([
    {name: "Urs" ,    img: "/img/BearImg.webp"}, 
    {name:"Vulpe" ,   img: "/img/FoxImg.webp"},
    {name:"Lup",      img: "/img/WolfImg.webp",},
  ]);

  return(
    <>
      <div className="minigame addBorder">
        <h2 className="titleText">{`Apasa pe bulina coresbunzatoare sunetului "${params.letter.toUpperCase()}"`}</h2>
          <div className="widgets">
            {animals.map((animal, index) =>(
                <Widget key={index} img={animal.img} name={animal.name} letter={params.letter} />
            ))}
          </div>
      </div>
    </>
  );
}

export default ColorMinigame;