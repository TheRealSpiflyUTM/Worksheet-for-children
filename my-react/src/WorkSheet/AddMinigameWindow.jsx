import { Button, Card, Empty, Modal, Typography } from "antd";
import { usePlatform } from "../platform/PlatformState.js";

const { Title } = Typography;

function AddMinigameWindow(params) {
  const { t } = usePlatform();
  return (
    <Modal
      className="addMinigameWindow"
      open={params.open}
      title={t("Add activity")}
      onCancel={params.closeFuntion}
      footer={<Button onClick={params.closeFuntion}>{t("Close")}</Button>}
      width={900}
    >
      <div className="games">
        {params.games.map((game) => (
          <Card
            key={game.id}
            className="game"
            hoverable
            onClick={() => params.addMinigame(game)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                params.addMinigame(game);
              }
            }}
            cover={
              <div className="gameCatalogSymbol" aria-hidden="true">
                {game.symbol}
              </div>
            }
          >
            <Title level={4}>{t(game.name)}</Title>
          </Card>
        ))}
      </div>
      {!params.games.length && (
        <Empty description={t("No activities are currently available.")} />
      )}
    </Modal>
  );
}
export default AddMinigameWindow;
