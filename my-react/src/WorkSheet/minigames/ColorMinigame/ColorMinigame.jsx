import { Input, Typography } from 'antd';
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

  function changeLetter(event) {
    const nextLetter = Array.from(event.target.value.trim()).at(-1);
    if(!nextLetter || !/^\p{L}$/u.test(nextLetter)) return;

    params.onGameChange({
      ...params.game,
      letter: nextLetter.toLocaleLowerCase("ro-RO"),
    });
  }

  const displayedLetter = letter?.toLocaleUpperCase("ro-RO") || "?";

  // Teacher / Kid Change
  if(params.isTeacher){
    return(
      <>
        <div className="minigame colorMinigame">
          <div className="colorGameHeader">
            <Title level={2} className="titleText">{`Apasa pe bulina corespunzatoare sunetului "${displayedLetter}"`}</Title>
            <label className="targetLetterControl">
              <span>Litera cautata</span>
              <Input
                className="targetLetterInput"
                value={displayedLetter}
                maxLength={1}
                aria-label="Litera cautata"
                onFocus={(event) => event.target.select()}
                onChange={changeLetter}
              />
            </label>
          </div>
            <div className="widgets">
              {animals.map((animal) =>(
                  <WidgetT 
                  key={`${animal.id}-${letter}`}
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
      <div className="minigame addBorder colorMinigame">
        <Title level={2} className="titleText">{`Apasa pe bulina corespunzatoare sunetului "${displayedLetter}"`}</Title>
          <div className="widgets">
            {animals.map((animal) =>(
                <WidgetK 
                key={`${animal.id}-${letter}`}
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
