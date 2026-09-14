import React, {useState, useRef} from 'react';
import "./Widget.css"
function Widget (params){

  // Values

  const[bubles, setBuble]= useState(
    () => Array.from(params.name).map(() => false)
  );

  function playCorrectSFX() {
    const sound = new Audio("/sounds/check-mark.mp3");
    sound.play();
  }
  function bubleVerification(index) {
    if(bubles[index]) return;

    const currentLetter = params.name[index];
    const isMatch = currentLetter.toLowerCase() === params.letter; // letter comes lowercase
    
    if(isMatch){
      playCorrectSFX();
      // b for bubbles
      setBuble(b => {
        const updatedBubbles = [...b];
        updatedBubbles[index] = true;
        return updatedBubbles;
      });
    }
  }

  return(<>
    <div className="widget">
      <img src={params.img} alt="animal Image" />
      <h4 className='animalName'>{params.name}</h4>
      <div className='bubles'>
        {bubles.map((buble, index)=> (
          <button 
            key={index} 
            className={buble ? "bubleActive" : "buble"} 
            onClick={() => bubleVerification(index)}
          />

        ))}
      </div>
    </div>
  </>);
}
export default Widget