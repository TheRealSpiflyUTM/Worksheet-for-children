import { useState } from 'react';
import { Button, Image, Input } from 'antd';
import "./WidgetT.css"
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
    console.log(params.name[index]);
    if(bubles[index]) return;

    const currentLetter = params.name[index];
    const isMatch = currentLetter.toLowerCase() === params.letter.toLowerCase();
    
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
      <Image src={params.img} alt={params.name} preview={false} />
      <Input className='animalNameInput' value={params.name}
        maxLength={14}
        aria-label="Numele animalului"
        onChange={(event) =>{
          const newName = event.target.value;
          params.onNameChange(newName);
          setBuble(Array.from(newName, () => false));
        }}
      />
      
      <div className='bubles'>
        {bubles.map((buble, index)=> {
          const isSpace = params.name[index] === " ";
          return(
            <Button
              key={index} 
              type={buble ? "primary" : "default"}
              shape="circle"
              className={`${
                buble ? "bubleActive" : "buble"} ${
                isSpace ? "bubbleSpace" : ""}`}  
              onClick={() => bubleVerification(index)}
              aria-label={`Litera ${index + 1} din ${params.name}`}
              aria-pressed={buble}
            />
          )
        })}
      </div>
    </div>
  </>);
}
export default Widget
