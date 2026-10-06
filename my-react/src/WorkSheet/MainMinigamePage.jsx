import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, Button, Progress, message } from "antd";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { useBlocker, useParams } from "react-router-dom";
import {
  getWorksheet,
  getWorksheetItems,
  getMiniGameDefinitions,
  renameWorksheet,
  createWorksheetItem,
  updateWorksheetItem,
  deleteWorksheetItem,
} from "../api/worksheets.js";
import { gameRegistry, saveDraft } from "../platform/game-model.js";
import { usePlatform } from "../platform/PlatformState.js";
import { Resource } from "../platform/PlatformUI.jsx";
import { useResource } from "../platform/useResource.js";
import { ShareWorksheetModal } from "../platform/WorksheetActions.jsx";
import ChildMinigame from "./ChildMinigame.jsx";
import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import MathMinigame from "./minigames/Mathgame/MathMinigame.jsx";
import SequenceMinigame from "./minigames/Sequencegame/SequenceMinigame.jsx";
import HigherOrLowerMinigame from "./minigames/HigherOrLower/HigherOrLowergame.jsx";
import OddOrEvenMinigame from "./minigames/OddOrEven/OddOrEvengame.jsx";
import MatchingMinigame from "./minigames/MatchingGame/MatchingMinigame.jsx";
import AddMinigameWindow from "./AddMinigameWindow.jsx";
import WorksheetSprinkles from "./WorksheetSprinkles.jsx";
import WorksheetToolbar from "./WorksheetToolbar.jsx";
import "./MainMinigamePage.css";
import "./PlayfulMinigames.css";

const gameComponents = {
  "color-game": ColorMinigame,
  "math-game": MathMinigame,
  "sequence-game": SequenceMinigame,
  "higher-lower-game": HigherOrLowerMinigame,
  "odd-even-game": OddOrEvenMinigame,
  "matching-game": MatchingMinigame,
};

function WorksheetGameFrame({ children }) {
  const frameRef = useRef(null);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const card = frame.querySelector(".worksheetGameContent > *");
    if (!card) return;
    const positionActions = () => {
      const frameBox = frame.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      frame.style.setProperty(
        "--game-card-right",
        `${cardBox.right - frameBox.left}px`,
      );
      frame.style.setProperty(
        "--game-card-center",
        `${cardBox.top - frameBox.top + cardBox.height / 2}px`,
      );
    };
    positionActions();
    const observer = new ResizeObserver(positionActions);
    observer.observe(frame);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="worksheetGameFrame" ref={frameRef}>
      {children}
    </div>
  );
}

function configurationOf(game) {
  const configuration = { ...game };
  for (const key of [
    "id",
    "name",
    "img",
    "instanceId",
    "itemId",
    "miniGameId",
    "orderIndex",
    "decorationSeed",
  ])
    delete configuration[key];
  return configuration;
}

export default function MainMinigamePage({ isTeacher }) {
  return isTeacher ? <WorksheetLoader /> : null;
}

function WorksheetLoader() {
  const { worksheetId } = useParams();
  const resource = useResource(async () => {
    const [worksheet, definitions] = await Promise.all([
      getWorksheet(worksheetId),
      getMiniGameDefinitions(),
    ]);
    const items = Array.isArray(worksheet.items)
      ? worksheet.items
      : await getWorksheetItems(worksheetId);
    const games = [...items]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => {
        const definition =
          item.definition ||
          definitions.find((entry) => entry.id === item.miniGameId);
        if (!gameComponents[definition?.type])
          throw new Error(
            "This worksheet contains an unavailable activity. Its saved content has been preserved.",
          );
        return {
          ...structuredClone(definition.defaultConfiguration || {}),
          ...item.configuration,
          id: definition.type,
          name: gameRegistry[definition.type].title,
          instanceId: `item-${item.id}`,
          decorationSeed: `worksheet-${worksheetId}-item-${item.id}`,
          itemId: item.id,
          miniGameId: item.miniGameId,
          orderIndex: item.orderIndex,
        };
      });
    return { worksheet, definitions, games };
  }, [worksheetId]);
  return (
    <Resource resource={resource}>
      {(data) => (
        <WorksheetEditor
          key={data.worksheet.id}
          worksheetId={data.worksheet.id}
          initial={data}
        />
      )}
    </Resource>
  );
}

function WorksheetEditor({ worksheetId, initial }) {
  const { t } = usePlatform();
  const [name, setName] = useState(initial.worksheet.name);
  const [games, setGames] = useState(initial.games);
  const [removed, setRemoved] = useState([]);
  const [undo, setUndo] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const saveLock = useRef(false);
  const shortcut = useRef(null);
  const pendingScroll = useRef(null);
  const gameElements = useRef(new Map());
  const blocker = useBlocker(dirty || saving);

  const available = Object.keys(gameComponents).flatMap((type) => {
    const definition = initial.definitions
      .filter((entry) => entry.type === type && entry.active !== false)
      .sort((a, b) => b.version - a.version)[0];
    return definition
      ? [
          {
            ...definition,
            id: type,
            miniGameId: definition.id,
            name: gameRegistry[type].title,
            symbol: gameRegistry[type].symbol,
          },
        ]
      : [];
  });

  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (saving) {
      message.info(t("Please wait until saving finishes."));
      blocker.reset();
    } else if (
      window.confirm(
        t("You have unsaved worksheet changes. Leave without saving?"),
      )
    ) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker, saving, t]);

  useEffect(() => {
    const id = pendingScroll.current;
    if (!id || !gameElements.current.has(id)) return;
    pendingScroll.current = null;
    gameElements.current.get(id).scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }, [games]);

  function addGame(definition) {
    const id = crypto.randomUUID();
    const game = {
      ...structuredClone(definition.defaultConfiguration || {}),
      id: definition.id,
      name: definition.name,
      miniGameId: definition.miniGameId,
      instanceId: id,
      decorationSeed: id,
      itemId: null,
    };
    setGames((current) => {
      const next = [...current];
      const index = current.findIndex((entry) => entry.instanceId === selected);
      next.splice(index < 0 ? next.length : index + 1, 0, game);
      return next;
    });
    pendingScroll.current = id;
    setSelected(id);
    setAdding(false);
    setDirty(true);
  }

  function removeGame(game, index) {
    setUndo((current) => [...current, { game, index }]);
    if (game.itemId) setRemoved((current) => [...current, game.itemId]);
    setGames((current) =>
      current.filter((entry) => entry.instanceId !== game.instanceId),
    );
    setSelected(null);
    setDirty(true);
  }

  function undoRemoval() {
    const entry = undo.at(-1);
    if (!entry) return;
    setGames((current) => {
      const next = [...current];
      next.splice(entry.index, 0, entry.game);
      return next;
    });
    setRemoved((current) => current.filter((id) => id !== entry.game.itemId));
    setUndo((current) => current.slice(0, -1));
    setSelected(entry.game.instanceId);
    setDirty(true);
  }

  async function saveWorksheet() {
    if (saveLock.current || !dirty) return;
    if (!name.trim()) {
      setError(new Error(t("Enter a worksheet name.")));
      return;
    }
    saveLock.current = true;
    setSaving(true);
    setError(null);
    setUndo([]);
    try {
      await saveDraft(
        {
          renameWorksheet,
          deleteItem: deleteWorksheetItem,
          saveItem: (id, item) => {
            const payload = {
              miniGameId: item.miniGameId,
              orderIndex: item.orderIndex,
              configuration: item.configuration,
            };
            return item.id
              ? updateWorksheetItem(id, item.id, payload)
              : createWorksheetItem(id, payload);
          },
        },
        worksheetId,
        {
          name,
          items: games.map((game) => ({
            key: game.instanceId,
            id: game.itemId,
            miniGameId: game.miniGameId,
            orderIndex: game.orderIndex,
            configuration: configurationOf(game),
          })),
        },
        removed,
        (key, item) =>
          setGames((current) =>
            current.map((game) =>
              game.instanceId === key
                ? { ...game, itemId: item.id, orderIndex: item.orderIndex }
                : game,
            ),
          ),
        (id) =>
          setRemoved((current) => current.filter((entry) => entry !== id)),
      );
      setName(name.trim());
      setDirty(false);
      message.success(t("Worksheet saved successfully."));
    } catch (requestError) {
      setError(requestError);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  useEffect(() => {
    shortcut.current = saveWorksheet;
  });
  useEffect(() => {
    const onKey = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        if (!event.repeat) void shortcut.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toolbar = (
    <WorksheetToolbar
      name={name}
      onNameChange={(value) => {
        setName(value);
        setDirty(true);
      }}
      dirty={dirty}
      saving={saving}
      hasGames={games.length > 0}
      canUndo={undo.length > 0}
      onSave={saveWorksheet}
      onShare={() => setShareOpen(true)}
      onUndo={undoRemoval}
      onPreview={() => {
        setPreviewIndex(0);
        setPreviewing(true);
      }}
      previewing={previewing}
      onBack={() => setPreviewing(false)}
    />
  );

  if (previewing)
    return (
      <main className="mainMinigamePage">
        {toolbar}
        <Progress
          percent={Math.round((previewIndex / games.length) * 100)}
          showInfo={false}
        />
        {games[previewIndex] ? (
          <>
            <p className="worksheetActivityProgress">
              {t("Activity {current} of {total}", {
                current: previewIndex + 1,
                total: games.length,
              })}
            </p>
            <ChildMinigame
              key={games[previewIndex].instanceId}
              game={games[previewIndex]}
              onComplete={() => setPreviewIndex((current) => current + 1)}
            />
            <div className="childGameActions">
              <Button onClick={() => setPreviewIndex((current) => current + 1)}>
                {t("Skip activity")}
              </Button>
            </div>
          </>
        ) : (
          <div className="childGameActions">
            <p>{t("You finished all the activities!")}</p>
            <Button onClick={() => setPreviewIndex(0)}>
              {t("Play again")}
            </Button>
          </div>
        )}
      </main>
    );

  return (
    <main className="mainMinigamePage" aria-busy={saving}>
      {toolbar}
      {error && (
        <Alert
          type="error"
          showIcon
          title={t(error.message)}
          description={t(
            "Some changes may have been saved. Your remaining edits are kept here; retry saving to finish.",
          )}
          action={
            <Button disabled={saving} onClick={saveWorksheet}>
              {t("Try again")}
            </Button>
          }
        />
      )}
      <div className="worksheetEditorLayout">
        <section className="worksheetCanvas" inert={saving}>
          {!games.length ? (
            <Button
              className="firstAddMinigameButton"
              type="primary"
              size="large"
              icon={<PlusOutlined aria-hidden="true" />}
              onClick={() => setAdding(true)}
            >
              {t("Add activity")}
            </Button>
          ) : (
            <div className="addedGames">
              {games.map((game, index) => {
                const Game = gameComponents[game.id];
                return (
                  <WorksheetGameFrame key={game.instanceId}>
                    <WorksheetSprinkles seed={game.decorationSeed} />
                    <div
                      className={`worksheetGame ${selected === game.instanceId ? "selectedGame" : ""}`}
                      ref={(element) => {
                        if (element)
                          gameElements.current.set(game.instanceId, element);
                        else gameElements.current.delete(game.instanceId);
                      }}
                      onClick={() => setSelected(game.instanceId)}
                    >
                      <div className="worksheetGameContent">
                        <Game
                          isTeacher
                          game={game}
                          onGameChange={(updated) => {
                            setGames((current) =>
                              current.map((entry) =>
                                entry.instanceId === game.instanceId
                                  ? updated
                                  : entry,
                              ),
                            );
                            setDirty(true);
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      className="worksheetCardAction worksheetCardAction--add"
                      aria-label={t("Add activity")}
                      disabled={saving}
                      icon={<PlusOutlined aria-hidden="true" />}
                      onClick={() => {
                        setSelected(game.instanceId);
                        setAdding(true);
                      }}
                    />
                    <Button
                      className="worksheetCardAction worksheetCardAction--remove"
                      aria-label={t("Remove activity")}
                      disabled={saving}
                      icon={<CloseOutlined aria-hidden="true" />}
                      onClick={() => removeGame(game, index)}
                    />
                  </WorksheetGameFrame>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <AddMinigameWindow
        open={adding && !saving}
        closeFuntion={() => setAdding(false)}
        games={available}
        addMinigame={addGame}
      />
      <ShareWorksheetModal
        worksheetId={worksheetId}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </main>
  );
}
