import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Popover,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { EMOJI_CATEGORIES } from "./emojis.js";
import "./MatchingMinigame.css";

const { Text, Title } = Typography;

const DEFAULT_PAIRS = [
  {
    id: "one",
    number: 1,
    emoji: "🍎",
  },
  {
    id: "two",
    number: 2,
    emoji: "🍊",
  },
  {
    id: "three",
    number: 3,
    emoji: "🍌",
  },
];

const createPairId = () => {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `pair-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
};

const clonePairs = (source) => {
  return source.map((pair) => ({
    id: pair.id || createPairId(),
    number: Number(pair.number) || 1,
    emoji: pair.emoji || "🍎",
  }));
};

const shuffleArray = (array) => {
  const shuffled = [...array];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const MatchingMinigame = ({
  isTeacher = false,
  game = {},
  onGameChange,
}) => {
  const initialPairs =
    Array.isArray(game?.pairs) &&
    game.pairs.length > 0
      ? clonePairs(game.pairs)
      : clonePairs(DEFAULT_PAIRS);

  const [pairs, setPairs] = useState(initialPairs);
  const [shuffledPairs, setShuffledPairs] = useState(() =>
    isTeacher ? [] : shuffleArray(initialPairs)
  );
  const [matches, setMatches] = useState({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [draggedNumber, setDraggedNumber] =
    useState(null);
  const [dragSource, setDragSource] =
    useState(null);

  const lastParentConfiguration = useRef(
    JSON.stringify(initialPairs)
  );

  useEffect(() => {
    const parentPairs =
      Array.isArray(game?.pairs) &&
      game.pairs.length > 0
        ? clonePairs(game.pairs)
        : clonePairs(DEFAULT_PAIRS);

    const parentConfiguration =
      JSON.stringify(parentPairs);

    if (
      parentConfiguration !==
      lastParentConfiguration.current
    ) {
      setPairs(parentPairs);

      lastParentConfiguration.current =
        parentConfiguration;

      setMatches({});
      setChecked(false);
      setScore(0);
      setDraggedNumber(null);
      setDragSource(null);
    }
  }, [game?.pairs]);

  const updateConfiguration = (newPairs) => {
    const normalizedPairs =
      clonePairs(newPairs);

    setPairs(normalizedPairs);

    lastParentConfiguration.current =
      JSON.stringify(normalizedPairs);

    setChecked(false);

    if (onGameChange) {
      onGameChange({
        ...game,
        pairs: normalizedPairs,
      });
    }
  };

  const updatePair = (
    pairId,
    field,
    value
  ) => {
    const newPairs = pairs.map((pair) => {
      if (pair.id !== pairId) {
        return pair;
      }

      return {
        ...pair,
        [field]:
          field === "number"
            ? Number(value) || 1
            : value,
      };
    });

    updateConfiguration(newPairs);
  };

  const addPair = () => {
    if (pairs.length >= 6) {
    return;
  }
    const usedNumbers = new Set(
      pairs.map((pair) =>
        Number(pair.number)
      )
    );

    let nextNumber = 1;

    while (usedNumbers.has(nextNumber)) {
      nextNumber += 1;
    }

    const allEmojis = Object.values(
      EMOJI_CATEGORIES
    ).flat();

    const usedEmojis = new Set(
      pairs.map((pair) => pair.emoji)
    );

    const firstUnusedEmoji =
      allEmojis.find(
        (emoji) =>
          !usedEmojis.has(emoji)
      ) || "🍎";

    const newPair = {
      id: createPairId(),
      number: nextNumber,
      emoji: firstUnusedEmoji,
    };

    updateConfiguration([
      ...pairs,
      newPair,
    ]);
  };

  const removePair = (pairId) => {
    if (pairs.length <= 1) {
      return;
    }

    const newPairs = pairs.filter(
      (pair) => pair.id !== pairId
    );

    updateConfiguration(newPairs);

    setMatches((previous) => {
      const next = { ...previous };

      delete next[pairId];

      return next;
    });
  };

  const objectGroups = useMemo(() => {
    const source =
      shuffledPairs.length === 0
        ? pairs
        : shuffledPairs;

    return source.map((pair) => ({
      ...pair,
      objects: Array.from(
        {
          length: Math.max(
            1,
            Number(pair.number) || 1
          ),
        },
        (_, index) =>
          `${pair.id}-${index}`
      ),
    }));
  }, [pairs, shuffledPairs]);

  const isNumberUsed = (number) => {
    return Object.values(
      matches
    ).includes(number);
  };

  const handleNumberDragStart = (
    event,
    pair
  ) => {
    if (isNumberUsed(pair.number)) {
      event.preventDefault();
      return;
    }

    setDraggedNumber(pair.number);
    setDragSource("left");

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      String(pair.number)
    );

    event.dataTransfer.setData(
      "application/x-matching-source",
      "left"
    );
  };

  const handlePlacedNumberDragStart = (
    event,
    number
  ) => {
    setDraggedNumber(number);
    setDragSource("right");

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      String(number)
    );

    event.dataTransfer.setData(
      "application/x-matching-source",
      "right"
    );
  };

  const handleDragEnd = () => {
    setDraggedNumber(null);
    setDragSource(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect =
      "move";
  };

  const handleLeftColumnDragOver = (
    event
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect =
      "move";
  };

  const handleDrop = (
    event,
    targetPair
  ) => {
    event.preventDefault();

    const rawNumber =
      event.dataTransfer.getData(
        "text/plain"
      );

    if (!rawNumber) {
      setDraggedNumber(null);
      setDragSource(null);
      return;
    }

    const number = Number(rawNumber);

    if (isNumberUsed(number)) {
      setDraggedNumber(null);
      setDragSource(null);
      return;
    }

    if (
      matches[targetPair.id] !== undefined
    ) {
      setDraggedNumber(null);
      setDragSource(null);
      return;
    }

    setMatches((previous) => ({
      ...previous,
      [targetPair.id]: number,
    }));

    setChecked(false);
    setDraggedNumber(null);
    setDragSource(null);
  };

  const handleDropBackToLeft = (
    event
  ) => {
    event.preventDefault();

    const rawNumber =
      event.dataTransfer.getData(
        "text/plain"
      );

    if (!rawNumber) {
      setDraggedNumber(null);
      setDragSource(null);
      return;
    }

    const number = Number(rawNumber);

    setMatches((previous) => {
      const next = { ...previous };

      Object.keys(next).forEach(
        (targetId) => {
          if (next[targetId] === number) {
            delete next[targetId];
          }
        }
      );

      return next;
    });

    setChecked(false);
    setDraggedNumber(null);
    setDragSource(null);
  };

  const checkAnswers = () => {
    let correct = 0;

    pairs.forEach((pair) => {
      if (
        matches[pair.id] === pair.number
      ) {
        correct += 1;
      }
    });

    setScore(correct);
    setChecked(true);
  };

  const resetAnswers = () => {
    setMatches({});
    setChecked(false);
    setScore(0);
    setDraggedNumber(null);
    setDragSource(null);
  };

  const shuffleForNewAttempt = () => {
    setShuffledPairs(
      shuffleArray(pairs)
    );

    setMatches({});
    setChecked(false);
    setScore(0);
    setDraggedNumber(null);
    setDragSource(null);
  };

  const getTargetStatus = (pair) => {
    if (!checked) {
      return "neutral";
    }

    if (
      matches[pair.id] === pair.number
    ) {
      return "correct";
    }

    if (
      matches[pair.id] !== undefined
    ) {
      return "incorrect";
    }

    return "neutral";
  };

  const getNumberStatus = (number) => {
    if (!checked) {
      return "neutral";
    }

    const targetPair = pairs.find(
      (pair) =>
        matches[pair.id] === number
    );

    if (!targetPair) {
      return "neutral";
    }

    if (targetPair.number === number) {
      return "correct";
    }

    return "incorrect";
  };

  const renderEmojiPicker = (pair) => {
    return (
      <div className="matching-emoji-picker">
        <div className="matching-emoji-picker-title">
          Choose an emoji
        </div>

        {Object.entries(
          EMOJI_CATEGORIES
        ).map(
          ([categoryName, emojis]) => (
            <div
              className="matching-emoji-category"
              key={categoryName}
            >
              <div className="matching-emoji-category-title">
                {categoryName}
              </div>

              <div className="matching-emoji-grid">
                {emojis.map(
                  (emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      className={`matching-emoji-button ${
                        pair.emoji ===
                        emoji
                          ? "matching-emoji-button-selected"
                          : ""
                      }`}
                      onClick={() => {
                        updatePair(
                          pair.id,
                          "emoji",
                          emoji
                        );
                      }}
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  const renderTeacherSettings = () => {
    if (!isTeacher) {
      return null;
    }

    return (
      <Card
        className="matching-settings-card"
        title="Match the Amounts"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addPair}
          >
            Add Pair
          </Button>
        }
      >
        <Space
          direction="vertical"
          size={12}
          className="matching-settings-list"
        >
          {pairs.map(
            (pair, index) => (
              <div
                className="matching-settings-row"
                key={pair.id}
              >
                <Text strong>
                  Pair {index + 1}
                </Text>

                <InputNumber
                  min={1}
                  max={50}
                  value={pair.number}
                  onChange={(value) => {
                    updatePair(
                      pair.id,
                      "number",
                      value || 1
                    );
                  }}
                />

                <Popover
                  trigger="click"
                  placement="bottom"
                  content={renderEmojiPicker(
                    pair
                  )}
                >
                  <Button className="matching-emoji-selector">
                    <span className="matching-selected-emoji">
                      {pair.emoji}
                    </span>
                  </Button>
                </Popover>

                <Tag>
                  {pair.number}{" "}
                  {pair.number === 1
                    ? "object"
                    : "objects"}
                </Tag>

                <Button
                  danger
                  type="text"
                  icon={
                    <DeleteOutlined />
                  }
                  disabled={
                    pairs.length <= 1
                  }
                  onClick={() =>
                    removePair(
                      pair.id
                    )
                  }
                />
              </div>
            )
          )}
        </Space>
      </Card>
    );
  };

  if (isTeacher) {
    return (
      <div className="matching-minigame matching-game-wrapper">
        {renderTeacherSettings()}
      </div>
    );
  }

  return (
    <div className="matching-minigame matching-game-wrapper">
      <Card className="matching-game-card">
        <div className="matching-game-header">
          <div>
            <Title
              level={3}
              className="matching-game-title"
            >
              {game?.name ||
                "Match the Amounts"}
            </Title>

            <Text type="secondary">
              Drag each number to the
              group with the same amount.
            </Text>
          </div>

          <Space>
            {checked && (
              <Tag
                color={
                  score === pairs.length
                    ? "green"
                    : "blue"
                }
              >
                Score: {score} /{" "}
                {pairs.length}
              </Tag>
            )}

            <Button
              icon={
                <ReloadOutlined />
              }
              onClick={resetAnswers}
            >
              Reset
            </Button>

            <Button
              icon={
                <ReloadOutlined />
              }
              onClick={
                shuffleForNewAttempt
              }
            >
              Shuffle
            </Button>

            <Button
              type="primary"
              icon={
                <CheckOutlined />
              }
              onClick={checkAnswers}
            >
              Check Answer
            </Button>
          </Space>
        </div>

        {checked && (
          <Alert
            className="matching-result-alert"
            type={
              score === pairs.length
                ? "success"
                : "info"
            }
            showIcon
            message={`You got ${score} out of ${pairs.length} correct.`}
          />
        )}

        <div className="matching-columns">
          <div
            className={`matching-column ${
              dragSource === "right"
                ? "matching-column-drop-active"
                : ""
            }`}
            onDragOver={
              handleLeftColumnDragOver
            }
            onDrop={
              handleDropBackToLeft
            }
          >
            <Card
              className="matching-column-card"
              title="Numbers"
            >
              <div className="matching-number-list">
                {pairs.map((pair) => {
                  const used =
                    isNumberUsed(
                      pair.number
                    );

                  const status =
                    getNumberStatus(
                      pair.number
                    );

                  return (
                    <div
                      key={pair.id}
                      className={`matching-number-card matching-status-${status} ${
                        used
                          ? "matching-number-used"
                          : ""
                      } ${
                        draggedNumber ===
                        pair.number
                          ? "matching-number-dragging"
                          : ""
                      }`}
                      draggable={!used}
                      onDragStart={(event) =>
                        handleNumberDragStart(
                          event,
                          pair
                        )
                      }
                      onDragEnd={
                        handleDragEnd
                      }
                    >
                      <span className="matching-number-value">
                        {pair.number}
                      </span>
                    </div>
                  );
                })}
              </div>

              {dragSource === "right" && (
                <div className="matching-return-hint">
                  Drop here to return
                  the number
                </div>
              )}
            </Card>
          </div>

          <div className="matching-column">
            <Card
              className="matching-column-card"
              title="Objects"
            >
              <div className="matching-target-list">
                {objectGroups.map(
                  (pair) => {
                    const status =
                      getTargetStatus(
                        pair
                      );

                    const hasNumber =
                      matches[
                        pair.id
                      ] !== undefined;

                    return (
                      <div
                        key={pair.id}
                        className={`matching-target-card matching-status-${status} ${
                          hasNumber
                            ? "matching-target-used"
                            : ""
                        } ${
                          draggedNumber !==
                            null &&
                          !hasNumber
                            ? "matching-target-drop-active"
                            : ""
                        }`}
                        onDragOver={
                          hasNumber
                            ? undefined
                            : handleDragOver
                        }
                        onDrop={
                          hasNumber
                            ? undefined
                            : (event) =>
                                handleDrop(
                                  event,
                                  pair
                                )
                        }
                      >
                        <div className="matching-objects">
                          {pair.objects.map(
                            (objectId) => (
                              <span
                                className="matching-object"
                                key={objectId}
                              >
                                {
                                  pair.emoji
                                }
                              </span>
                            )
                          )}
                        </div>

                        {hasNumber && (
                          <div
                            className={`matching-placed-number ${
                              draggedNumber ===
                              matches[
                                pair.id
                              ]
                                ? "matching-placed-number-dragging"
                                : ""
                            }`}
                            draggable
                            onDragStart={(
                              event
                            ) =>
                              handlePlacedNumberDragStart(
                                event,
                                matches[
                                  pair.id
                                ]
                              )
                            }
                            onDragEnd={
                              handleDragEnd
                            }
                            title="Drag back to the Numbers column"
                          >
                            {
                              matches[
                                pair.id
                              ]
                            }
                          </div>
                        )}

                        {!hasNumber && (
                          <div className="matching-drop-placeholder">
                            Drop number
                            here
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MatchingMinigame;
