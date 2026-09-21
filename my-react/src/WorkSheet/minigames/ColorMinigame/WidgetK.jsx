import { useState } from 'react';
import { Button, Image, Typography } from 'antd';
import "./WidgetK.css"

const { Title } = Typography;

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
      <Image src={params.img} alt={params.name} preview={false} />
      <Title level={4} className='animalNameText'>{params.name}</Title>
      <div className='bubles'>
        {bubles.map((buble, index)=> (
          <Button
            key={index} 
            type={buble ? "primary" : "default"}
            shape="circle"
            className={buble ? "bubleActive" : "buble"} 
            onClick={() => bubleVerification(index)}
            aria-label={`Litera ${index + 1} din ${params.name}`}
            aria-pressed={buble}
          />

        ))}
      </div>
    </div>
  </>);
}
export default Widget
