function AddMinigameWindow(params) {
  
  if(!params.open) return;
  
  return(<>
    <div className="addMinigameWindow">
      <div className="games">

        {params.games.map((game, index) => (
          <div key={index} className="game addBorder" onClick={() => params.addMinigame(game)}>
            <h2>{game.name}</h2>
            <img src={game.img} alt="Game Image" />
          </div>
        ))}

      <button className="closeButton" onClick={params.closeFuntion}>CloseWindow</button>
      </div>
    </div>
  </>);
}
export default AddMinigameWindow