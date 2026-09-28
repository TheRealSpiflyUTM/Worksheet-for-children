// K is for kids
// T is for teacher
// We will use this to switch between teacher and student version
import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import MathMinigame from "./minigames/Mathgame/MathMinigame.jsx";
import SequenceMinigame from "./minigames/Sequencegame/SequenceMinigame.jsx";
import HigherOrLowerMinigame from "./minigames/HigherOrLower/HigherOrLowergame.jsx";
import OddOrEvenMinigame from "./minigames/OddOrEven/OddOrEvengame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import { useState, useRef, useEffect } from "react";
import { Button, message, Spin } from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  getWorksheet,
  getWorksheetItems,
  createWorksheetItem,
  updateWorksheetItem,
  getMiniGameDefinitions,
} from "../api/worksheets.js";
import "./MainMinigamePage.css";

function MainMinigamePage(params) {
  const { worksheetId } = useParams();

  /*
    These are the games that exist in the frontend.
    The "id" here is important.
    It matches the "type" returned by the backend:
    color-game
    math-game
    sequence-game
    higher-lower-game
    odd-even-game
  */
  const availableMinigames = [
    {
      id: "color-game",
      name: "Color Game",
      img: "/img/ColorGame.png",
      letter: "u",
      animals: [
        {
          id: "bear",
          name: "Urs",
          img: "/img/BearImg.webp",
        },
        {
          id: "fox",
          name: "Vulpe",
          img: "/img/FoxImg.webp",
        },
        {
          id: "wolf",
          name: "Lup",
          img: "/img/WolfImg.webp",
        },
      ],
    },
    {
      id: "math-game",
      name: "Easy Math",
      img: "/img/MathGame.png",
      maxNumber: 10,
      operations: ["+", "-", "*", "/"],
    },
    {
      id: "sequence-game",
      name: "Number Sequence",
      img: "/img/SequenceGame.png",
      maxNumber: 10,
    },
    {
      id: "higher-lower-game",
      name: "Higher or Lower",
      img: "/img/HigherLowerGame.png",
      maxNumber: 10,
    },
    {
      id: "odd-even-game",
      name: "Odd or Even",
      img: "/img/OddEvenGame.png",
      maxNumber: 10,
    },
  ];

  const [selectedGameId, setSelectedGameId] = useState(null);
  const [isAddMinigameOpen, setIsAddMinigameOpen] = useState(false);
  const [addedMinigames, setAddedMinigames] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectedAreaRef = useRef(null);

  /*
    Load the worksheet from the backend.
    This is only needed when a worksheetId exists.
    For the teacher:
    /teacher/:worksheetId
    For the student:
    /kids/:worksheetId
  */
  useEffect(() => {
    if (!worksheetId) {
      return;
    }
    loadWorksheet();
  }, [worksheetId]);

  async function loadWorksheet() {
    setIsLoading(true);
    try {
      /*
       * Get both:
       * 1. The worksheet
       * 2. The mini-game definitions
       */
      const [worksheet, miniGameDefinitions] = await Promise.all([
        getWorksheet(worksheetId),
        getMiniGameDefinitions(),
      ]);

      setDefinitions(miniGameDefinitions);

      let worksheetItems = worksheet.items;

      if (!Array.isArray(worksheetItems)) {
        worksheetItems = await getWorksheetItems(worksheetId);
      }

      const sortedItems = [...worksheetItems].sort(
        (a, b) => a.orderIndex - b.orderIndex
      );

      const loadedGames = sortedItems
        .map((item) => {
          const definition = miniGameDefinitions.find(
            (miniGame) => miniGame.id === item.miniGameId
          );

          if (!definition) {
            console.warn(
              `Mini-game with ID ${item.miniGameId} was not found on the server.`
            );
            return null;
          }

          const frontendGame = availableMinigames.find(
            (game) => game.id === definition.type
          );

          if (!frontendGame) {
            console.warn(
              `Mini-game type "${definition.type}" is not supported by the frontend.`
            );
            return null;
          }

          return {
            ...frontendGame,
            ...(item.configuration || {}),
            instanceId: crypto.randomUUID(),
            itemId: item.id,
            miniGameId: item.miniGameId,
            orderIndex: item.orderIndex,
          };
        })
        .filter(Boolean);

      setAddedMinigames(loadedGames);
    } catch (error) {
      console.error("Failed to load worksheet:", error);
      message.error(error.message || "Failed to load the worksheet.");
    } finally {
      setIsLoading(false);
    }
  }

  /*
    Add a new mini-game to the worksheet.
  */
  const addMinigameFunction = (game) => {
    const newGame = {
      ...game,
      instanceId: crypto.randomUUID(),
      itemId: null,
      miniGameId: null,
      animals: game.animals
        ? game.animals.map((animal) => ({
            ...animal,
          }))
        : undefined,
    };

    setAddedMinigames((currentGames) => {
      if (currentGames.length === 0) {
        return [newGame];
      }

      const selectedIndex = currentGames.findIndex(
        (currentGame) => currentGame.instanceId === selectedGameId
      );

      if (selectedIndex === -1) {
        return [...currentGames, newGame];
      }

      const updatedGames = [...currentGames];
      updatedGames.splice(selectedIndex + 1, 0, newGame);
      return updatedGames;
    });

    setSelectedGameId(newGame.instanceId);
    setIsAddMinigameOpen(false);
  };

  /*
    Update a mini-game configuration.
  */
  function updateMinigame(instanceId, updatedGame) {
    setAddedMinigames((currentGames) =>
      currentGames.map((game) =>
        game.instanceId === instanceId ? updatedGame : game
      )
    );
  }

  /*
    Remove frontend-only fields before sending configuration to backend.
  */
  function getGameConfiguration(game) {
    const {
      id,
      name,
      img,
      instanceId,
      itemId,
      miniGameId,
      orderIndex,
      ...configuration
    } = game;
    return configuration;
  }

  /*
    Save the whole worksheet.
  */
  async function saveWorksheet() {
    if (!worksheetId) {
      message.error("Worksheet ID is missing.");
      return;
    }
    setIsSaving(true);
    try {
      for (let index = 0; index < addedMinigames.length; index++) {
        const game = addedMinigames[index];

        const definition = definitions.find(
          (miniGame) => miniGame.type === game.id
        );

        if (!definition) {
          throw new Error(
            `Mini-game type "${game.id}" was not found on the server.`
          );
        }

        const item = {
          miniGameId: definition.id,
          orderIndex: index,
          configuration: getGameConfiguration(game),
        };

        if (game.itemId) {
          await updateWorksheetItem(worksheetId, game.itemId, item);
        } else {
          const createdItem = await createWorksheetItem(worksheetId, item);

          setAddedMinigames((currentGames) =>
            currentGames.map((currentGame) =>
              currentGame.instanceId === game.instanceId
                ? {
                    ...currentGame,
                    itemId: createdItem.id,
                    miniGameId: createdItem.miniGameId,
                    orderIndex: createdItem.orderIndex,
                  }
                : currentGame
            )
          );
        }
      }

      message.success("Worksheet saved successfully.");
    } catch (error) {
      console.error("Failed to save worksheet:", error);
      message.error(error.message || "Failed to save worksheet.");
    } finally {
      setIsSaving(false);
    }
  }

  /*
    Close selection when clicking outside the game area.
  */
  useEffect(() => {
    function handleClickAway(event) {
      if (isAddMinigameOpen) {
        return;
      }
      if (
        selectedAreaRef.current &&
        !selectedAreaRef.current.contains(event.target)
      ) {
        setSelectedGameId(null);
      }
    }
    document.addEventListener("pointerdown", handleClickAway);

    return () => {
      document.removeEventListener("pointerdown", handleClickAway);
    };
  }, [isAddMinigameOpen]);

  /*
    Show a loading state while the worksheet is being loaded.
  */
  if (isLoading) {
    return (
      <main className="mainMinigamePage loadingContainer">
        <Spin size="large" />
      </main>
    );
  }

  /*
    ============================
    TEACHER VERSION
    ============================
  */
  if (params.isTeacher) {
    return (
      <main className="mainMinigamePage">
        {addedMinigames.length === 0 ? (
          <Button
            className="firstAddMinigameButton"
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsAddMinigameOpen(true)}
          >
            Add Minigame
          </Button>
        ) : (
          <div className="addedGames" ref={selectedAreaRef}>
            {addedMinigames.map((game) => (
              <div
                className={
                  selectedGameId === game.instanceId
                    ? "addBorder selectedGame"
                    : "addBorder"
                }
                key={game.instanceId}
                onClick={() => setSelectedGameId(game.instanceId)}
              >
                {game.id === "color-game" && (
                  <ColorMinigame
                    isTeacher={params.isTeacher}
                    game={game}
                    onGameChange={(updatedGame) =>
                      updateMinigame(game.instanceId, updatedGame)
                    }
                  />
                )}

                {game.id === "math-game" && (
                  <MathMinigame
                    isTeacher={params.isTeacher}
                    game={game}
                    onGameChange={(updatedGame) =>
                      updateMinigame(game.instanceId, updatedGame)
                    }
                  />
                )}

                {game.id === "sequence-game" && (
                  <SequenceMinigame
                    isTeacher={params.isTeacher}
                    game={game}
                    onGameChange={(updatedGame) =>
                      updateMinigame(game.instanceId, updatedGame)
                    }
                  />
                )}

                {game.id === "higher-lower-game" && (
                  <HigherOrLowerMinigame
                    isTeacher={params.isTeacher}
                    game={game}
                    onGameChange={(updatedGame) =>
                      updateMinigame(game.instanceId, updatedGame)
                    }
                  />
                )}

                {game.id === "odd-even-game" && (
                  <OddOrEvenMinigame
                    isTeacher={params.isTeacher}
                    game={game}
                    onGameChange={(updatedGame) =>
                      updateMinigame(game.instanceId, updatedGame)
                    }
                  />
                )}

                {selectedGameId === game.instanceId && (
                  <Button
                    className="addMinigameButton"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsAddMinigameOpen(true);
                    }}
                  >
                    Add Minigame
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {addedMinigames.length > 0 && (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            onClick={saveWorksheet}
            style={{ marginTop: 20 }}
          >
            Save Worksheet
          </Button>
        )}

        <AddMinigameWindow
          open={isAddMinigameOpen}
          closeFuntion={() => setIsAddMinigameOpen(false)}
          games={availableMinigames}
          addMinigame={addMinigameFunction}
        />
      </main>
    );
  }

  /*
    ============================
    KIDS / STUDENT VERSION
    ============================
  */
  return (
    <main className="mainMinigamePage">
      {addedMinigames.map((game) => (
        <div key={game.instanceId}>
          {game.id === "color-game" && (
            <ColorMinigame isTeacher={false} game={game} />
          )}

          {game.id === "math-game" && (
            <MathMinigame isTeacher={false} game={game} />
          )}

          {game.id === "sequence-game" && (
            <SequenceMinigame isTeacher={false} game={game} />
          )}

          {game.id === "higher-lower-game" && (
            <HigherOrLowerMinigame isTeacher={false} game={game} />
          )}

          {game.id === "odd-even-game" && (
            <OddOrEvenMinigame isTeacher={false} game={game} />
          )}
        </div>
      ))}
    </main>
  );
}

export default MainMinigamePage;