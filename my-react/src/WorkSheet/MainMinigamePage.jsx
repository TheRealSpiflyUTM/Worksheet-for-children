// K is for kids
// T is for teacher
// We will use this to switch between teacher and student version
// #region Imports
import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import MathMinigame from "./minigames/Mathgame/MathMinigame.jsx";
import SequenceMinigame from "./minigames/Sequencegame/SequenceMinigame.jsx";
import HigherOrLowerMinigame from "./minigames/HigherOrLower/HigherOrLowergame.jsx";
import OddOrEvenMinigame from "./minigames/OddOrEven/OddOrEvengame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import WorksheetSprinkles from "./WorksheetSprinkles.jsx";
import { useState, useRef, useEffect } from "react";
import { Button, message, Spin } from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useBlocker, useParams } from "react-router-dom";
import {
  getWorksheet,
  getWorksheetItems,
  createWorksheetItem,
  updateWorksheetItem,
  getMiniGameDefinitions,
} from "../api/worksheets.js";
import "./MainMinigamePage.css";
import "./PlayfulMinigames.css";
// #endregion

const MIN_TOOLS_WIDTH = 180;
const MAX_TOOLS_WIDTH = 480;
const DEFAULT_TOOLS_WIDTH = 260;
const TOOLS_WIDTH_STORAGE_KEY = "worksheet-tools-width";

function MainMinigamePage(params) {
  // #region Values
  const [isPreviewing, setIsPreviewing] = useState(false);
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const selectedAreaRef = useRef(null);
  const saveWorksheetShortcutRef = useRef(null);
  const pendingScrollGameIdRef = useRef(null);
  const gameElementRefs = useRef(new Map());

  const navigationBlocker = useBlocker(
    params.isTeacher && hasUnsavedChanges
  );

  const [toolsWidth, setToolsWidth] = useState(() => {
    try {
      const savedWidth = Number(
        localStorage.getItem(TOOLS_WIDTH_STORAGE_KEY)
      );

      if (Number.isFinite(savedWidth) && savedWidth > 0) {
        return Math.min(
          MAX_TOOLS_WIDTH,
          Math.max(MIN_TOOLS_WIDTH, savedWidth)
        );
      }
    } catch (error) {
      console.warn("Could not load the saved tools width:", error);
    }

    return DEFAULT_TOOLS_WIDTH;
  });
  /*
    Load the worksheet from the backend.
    This is only needed when a worksheetId exists.
    For the teacher:
    /teacher/:worksheetId
    For the student:
    /kids/:worksheetId
  */
  // #endregion

  // #region functions

  useEffect(() => {
    try {
      localStorage.setItem(
        TOOLS_WIDTH_STORAGE_KEY,
        String(toolsWidth)
      );
    } catch (error) {
      console.warn("Could not save the tools width:", error);
    }
  }, [toolsWidth]);

  useEffect(() => {
    if (!params.isTeacher || !hasUnsavedChanges) {
      return;
    }

    function warnAboutUnsavedChanges(event) {
      event.preventDefault();
      event.returnValue = true;
    }

    window.addEventListener("beforeunload", warnAboutUnsavedChanges);

    return () => {
      window.removeEventListener("beforeunload", warnAboutUnsavedChanges);
    };
  }, [params.isTeacher, hasUnsavedChanges]);

  useEffect(() => {
    if (navigationBlocker.state !== "blocked") {
      return;
    }

    const shouldLeave = window.confirm(
      "You have unsaved worksheet changes. Leave without saving?"
    );

    if (shouldLeave) {
      navigationBlocker.proceed();
    } else {
      navigationBlocker.reset();
    }
  }, [navigationBlocker]);

  function startToolsResize(event) {
    event.preventDefault();

    const startingMouseX = event.clientX;
    const startingWidth = toolsWidth;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(moveEvent) {
      // Moving left makes the sidebar wider.
      const distance = startingMouseX - moveEvent.clientX;
      const requestedWidth = startingWidth + distance;

      const limitedWidth = Math.min(
        MAX_TOOLS_WIDTH,
        Math.max(MIN_TOOLS_WIDTH, requestedWidth)
      );

      setToolsWidth(limitedWidth);
    }

    function stopResize() {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }

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
            decorationSeed: `worksheet-${worksheetId}-item-${item.id}`,
            itemId: item.id,
            miniGameId: item.miniGameId,
            orderIndex: item.orderIndex,
          };
        })
        .filter(Boolean);

      setAddedMinigames(loadedGames);
      setHasUnsavedChanges(false);
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
      decorationSeed: crypto.randomUUID(),
      itemId: null,
      miniGameId: null,
      animals: game.animals
        ? game.animals.map((animal) => ({
            ...animal,
          }))
        : undefined,
    };

    pendingScrollGameIdRef.current = newGame.instanceId;

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
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    const gameId = pendingScrollGameIdRef.current;

    if (!gameId) {
      return;
    }

    const gameElement = gameElementRefs.current.get(gameId);

    if (!gameElement) {
      return;
    }

    pendingScrollGameIdRef.current = null;
    gameElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [addedMinigames]);

  /*
    Update a mini-game configuration.
  */
  function updateMinigame(instanceId, updatedGame) {
    setAddedMinigames((currentGames) =>
      currentGames.map((game) =>
        game.instanceId === instanceId ? updatedGame : game
      )
    );
    setHasUnsavedChanges(true);
  }

  /*
    Remove frontend-only fields before sending configuration to backend.
  */
  function getGameConfiguration(game) {
    const configuration = { ...game };
    delete configuration.id;
    delete configuration.name;
    delete configuration.img;
    delete configuration.instanceId;
    delete configuration.itemId;
    delete configuration.miniGameId;
    delete configuration.orderIndex;
    delete configuration.decorationSeed;
    return configuration;
  }

  /*
    Save the whole worksheet.
  */
  async function saveWorksheet() {
    if (isSaving) {
      return;
    }

    if (!worksheetId) {
      message.error("Worksheet ID is missing.");
      return;
    }
    setIsSaving(true);

    try {
      const itemsToSave = addedMinigames.map((game, index) => {
        const definition = definitions.find(
          (miniGame) => miniGame.type === game.id
        );

        if (!definition) {
          throw new Error(
            `Mini-game type "${game.id}" was not found on the server.`
          );
        }

        return {
          game,
          item: {
            miniGameId: definition.id,
            orderIndex: index,
            configuration: getGameConfiguration(game),
          },
        };
      });

      const existingItems = itemsToSave
        .filter(({ game }) => game.itemId)
        .sort((first, second) =>
          second.item.orderIndex - first.item.orderIndex
        );

      // Move existing items from bottom to top so each destination index is
      // free before a newly inserted item is created there.
      for (const { game, item } of existingItems) {
        await updateWorksheetItem(worksheetId, game.itemId, item);
      }

      for (const { game, item } of itemsToSave) {
        if (game.itemId) {
          continue;
        }

        const createdItem = await createWorksheetItem(worksheetId, item);

        // Store each new database ID immediately. If a later request fails,
        // retrying the save updates this item instead of creating it twice.
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

      setAddedMinigames((currentGames) =>
        currentGames.map((game, index) => ({
          ...game,
          orderIndex: index,
        }))
      );
      setHasUnsavedChanges(false);
      message.success("Worksheet saved successfully.");
    } catch (error) {
      console.error("Failed to save worksheet:", error);
      message.error(error.message || "Failed to save worksheet.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    saveWorksheetShortcutRef.current = params.isTeacher
      ? saveWorksheet
      : null;
  });

  useEffect(() => {
    function handleSaveShortcut(event) {
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "s";

      if (!isSaveShortcut || !saveWorksheetShortcutRef.current) {
        return;
      }

      event.preventDefault();

      if (!event.repeat) {
        saveWorksheetShortcutRef.current();
      }
    }

    window.addEventListener("keydown", handleSaveShortcut);

    return () => {
      window.removeEventListener("keydown", handleSaveShortcut);
    };
  }, []);

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


  // #endregion

  // #region Teacher

  if (params.isTeacher && !isPreviewing) {
    return (
      <main className="mainMinigamePage">
        <div
          className="worksheetEditorLayout"
          style={{ "--tools-width": `${toolsWidth}px` }}
        >
          <section className="worksheetCanvas">
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
                        ? "worksheetGame selectedGame"
                        : "worksheetGame "
                    }
                    key={game.instanceId}
                    ref={(element) => {
                      if (element) {
                        gameElementRefs.current.set(game.instanceId, element);
                      } else {
                        gameElementRefs.current.delete(game.instanceId);
                      }
                    }}
                    onClick={() => setSelectedGameId(game.instanceId)}
                  >
                    <WorksheetSprinkles seed={game.decorationSeed} />
                    <div className="worksheetGameContent">
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
                    </div>

                    <div
                      className={`addMinigameSlot ${
                        selectedGameId === game.instanceId ? "isOpen" : ""
                      }`}
                      aria-hidden={selectedGameId !== game.instanceId}
                    >
                      <div className="addMinigameSlotInner">
                        <Button
                          className="addMinigameButton"
                          type="primary"
                          icon={<PlusOutlined />}
                          tabIndex={
                            selectedGameId === game.instanceId ? 0 : -1
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            setIsAddMinigameOpen(true);
                          }}
                        >
                          Add Minigame
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <aside className="worksheetTools">
            <div
              className="worksheetToolsResizeHandle"
              role="separator"
              aria-label="Resize worksheet tools"
              aria-orientation="vertical"
              aria-valuemin={MIN_TOOLS_WIDTH}
              aria-valuemax={MAX_TOOLS_WIDTH}
              aria-valuenow={toolsWidth}
              onPointerDown={startToolsResize}
            />
            <Button
              className="saveWorksheetButton"
              type="primary"
              block
              icon={<SaveOutlined />}
              loading={isSaving}
              disabled={addedMinigames.length === 0}
              onClick={saveWorksheet}
            >
              Save Worksheet
            </Button>

            <Button
              block
              icon={<EyeOutlined />}
              disabled={addedMinigames.length === 0}
              onClick={() => setIsPreviewing(true)}
            >
              Preview as Kid
            </Button>
          </aside>
        </div>

        <AddMinigameWindow
          open={isAddMinigameOpen}
          closeFuntion={() => setIsAddMinigameOpen(false)}
          games={availableMinigames}
          addMinigame={addMinigameFunction}
        />
      </main>
    );
  }
  // #endregion

  // #region Children
  return (
    <main className="mainMinigamePage">
      {isPreviewing && (
          <div className="previewToolsBar">
            <Button
              icon={<ArrowLeftOutlined/>}
              onClick={() => setIsPreviewing(false)}
            >
              Back To Editor
            </Button>
          </div>
        )}
      {addedMinigames.map((game) => (
        <div className="worksheetGame worksheetGamePreview" key={game.instanceId}>
          <WorksheetSprinkles seed={game.decorationSeed} />
          <div className="worksheetGameContent">
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
        </div>
      ))}
    </main>
  );
  // #endregion
}

export default MainMinigamePage;
