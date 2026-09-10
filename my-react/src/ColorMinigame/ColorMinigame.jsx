import React, {useState, useRef} from 'react';
import Widget from "./Widget.jsx";
import './ColorMinigame.css';
function ColorMinigame(){
  const [animals, changeAnimals] = useState([
    {name: "Urs" , img: "", letter:"u"}, 
    {name:"Crocodil" , img:"", letter:"c"},
    {name:"Sasa", img:"", letter:"s"}
  ]);
  
  return(
    <>
      <div className="minigame addBorder">
        <h2 className="title">Coloreaza cu rosu bulina coresbunzatoare sunetului "u"</h2>
          <div className="widgets">
            {animals.map((animal, index) =>(
                <Widget key={index} img={animal.img} name={animal.name} />
            ))}
          </div>
      </div>
    </>
  );
}

export default ColorMinigame;