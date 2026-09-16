import React, {useState, useRef} from 'react';

function WorkSheetViewer(params) {
  
  const [workSheets , setWorkSheets] = useState([{name: "WorkSheet1"},]) ;


  


  return(<div>
    {workSheets.map((sheet , index) => {

      return(<h2>{sheet.name}</h2>);
    })}
  </div>)
};

export default WorkSheetViewer 