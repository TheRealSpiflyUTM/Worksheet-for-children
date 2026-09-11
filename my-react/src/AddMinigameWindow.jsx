
function AddMinigameWindow(params) {
  
  if(!params.open) return;
  
  return(<>
    <div className="addMinigameWindow">
    <div className="overlay"></div>
      <div className="games">

        <div className="game">
          <h2>{params.game.name}</h2>
          <img src={params.game.img} alt="Game Image" />
        </div>

      <button className="closeButton" onClick={params.closeFuntion}>CloseWindow</button>
      </div>
    </div>
  </>);
}
export default AddMinigameWindow