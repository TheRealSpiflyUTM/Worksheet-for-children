import { Button, Card, Image, Modal, Typography } from "antd";

const { Title } = Typography;

function AddMinigameWindow(params) {
  return (
    <Modal
      className="addMinigameWindow"
      open={params.open}
      title="Add Minigame"
      onCancel={params.closeFuntion}
      footer={
        <Button onClick={params.closeFuntion}>
          Close
        </Button>
      }
      width={900}
    >
      <div className="games">
        {params.games.map((game) => (
          <Card
            key={game.id}
            className="game"
            hoverable
            onClick={() => params.addMinigame(game)}
            cover={<Image src={game.img} alt={game.name} preview={false} />}
          >
            <Title level={4}>{game.name}</Title>
          </Card>
        ))}
      </div>
    </Modal>
  );
}
export default AddMinigameWindow;
