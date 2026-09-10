import React, {useState, useRef} from 'react';
import "./Widget.css"
function Widget (params){
  const[bubles, setBuble]= useState(
    () => Array.from(params.name).map(() => false)
  );
  return(<>
    <div className="widget">
      <img src={params.img} alt="animal Image" />
      <h4>{params.name}</h4>
      <div className='bubles'>
        {bubles.map((isSelected, index)=> (
          <button key={index} className="buble"></button>
        ))}
      </div>
    </div>
  </>);
}
export default Widget