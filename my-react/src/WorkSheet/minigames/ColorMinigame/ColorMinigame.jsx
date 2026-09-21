import { Typography } from 'antd';
import WidgetT from "./WidgetT.jsx";
import WidgetK from "./WidgetK.jsx";
import './ColorMinigame.css';

const { Title } = Typography;

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

  // Teacher / Kid Change
  if(params.isTeacher){
    return(
      <>
        <div className="minigame">
          <Title level={2} className="titleText">{`Apasa pe bulina corespunzatoare sunetului "${letter.toUpperCase()}"`}</Title>
            <div className="widgets">
              {animals.map((animal) =>(
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
        <Title level={2} className="titleText">{`Apasa pe bulina corespunzatoare sunetului "${letter.toUpperCase()}"`}</Title>
          <div className="widgets">
            {animals.map((animal) =>(
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
