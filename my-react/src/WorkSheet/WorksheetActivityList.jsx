import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { gameRegistry } from "../platform/game-model.js";
import { usePlatform } from "../platform/PlatformState.js";

export default function WorksheetActivityList({
  games,
  selected,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onDrop,
  disabled,
}) {
  const { t } = usePlatform();
  const [dragView, setDragView] = useState(null);
  const listRef = useRef(null);
  const gesture = useRef(null);

  function stopGesture() {
    const current = gesture.current;
    if (!current) return;
    clearTimeout(current.timer);
    cancelAnimationFrame(current.frame);
    if (current.active || current.moved)
      current.element.dataset.suppressClick = "true";
    gesture.current = null;
    if (current.element.hasPointerCapture(current.pointerId))
      current.element.releasePointerCapture(current.pointerId);
    setDragView(null);
  }

  useEffect(() => {
    const cancel = (event) => {
      if (event.key === "Escape") stopGesture();
    };
    window.addEventListener("keydown", cancel);
    window.addEventListener("blur", stopGesture);
    return () => {
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("blur", stopGesture);
      const current = gesture.current;
      if (current) {
        clearTimeout(current.timer);
        cancelAnimationFrame(current.frame);
        gesture.current = null;
      }
    };
  }, []);

  function scrollContainer(element) {
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      if (
        /auto|scroll/.test(getComputedStyle(parent).overflowY) &&
        parent.scrollHeight > parent.clientHeight
      )
        return parent;
    }
    return document.scrollingElement;
  }

  function updateTarget(current) {
    // Compare against the original positions, not the animated cards, to avoid oscillating targets.
    const source = current.items[current.sourceIndex];
    const center = current.y - current.offsetY + source.height / 2;
    let destination = current.sourceIndex;
    if (
      current.x >= source.left - 36 &&
      current.x <= source.left + source.width + 36
    ) {
      let distance = Infinity;
      current.items.forEach((item, index) => {
        const next = Math.abs(
          center - (item.top - current.scroller.scrollTop + item.height / 2),
        );
        if (next < distance) {
          distance = next;
          destination = index;
        }
      });
    }
    const order = [...current.items];
    order.splice(destination, 0, order.splice(current.sourceIndex, 1)[0]);
    let top = current.items[0].top;
    const offsets = {};
    order.forEach((item) => {
      offsets[item.id] = top - item.top;
      top += item.height + current.gap;
    });
    current.offsets = offsets;
    current.target =
      destination === current.sourceIndex
        ? null
        : {
            id: current.items[destination].id,
            after: destination > current.sourceIndex,
          };
    setDragView((view) => ({
      ...view,
      x: current.x - current.offsetX,
      y: current.y - current.offsetY,
      offsets,
      position: destination + 1,
    }));
  }

  function startHold(event, id) {
    if (disabled || event.button !== 0 || !event.isPrimary || gesture.current)
      return;
    const element = event.currentTarget;
    const current = {
      id,
      element,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      pointerType: event.pointerType,
      scroller: scrollContainer(element),
      active: false,
      moved: false,
    };
    gesture.current = current;
    element.setPointerCapture(event.pointerId);
    if (current.pointerType === "touch")
      current.timer = setTimeout(() => startDrag(current), 50);
  }

  function startDrag(current) {
    if (gesture.current !== current || current.active) return;
    const { id } = current;
    current.active = true;
    current.items = Array.from(
      listRef.current.querySelectorAll("li[data-activity-id]"),
    ).map((row) => {
      const box = row.getBoundingClientRect();
      return {
        id: row.dataset.activityId,
        left: box.left,
        top: box.top + current.scroller.scrollTop,
        width: box.width,
        height: box.height,
      };
    });
    current.sourceIndex = current.items.findIndex((item) => item.id === id);
    const source = current.items[current.sourceIndex];
    current.gap =
      parseFloat(
        getComputedStyle(listRef.current.querySelector("ol")).rowGap,
      ) || 0;
    current.offsetX = current.startX - source.left;
    current.offsetY =
      current.startY - (source.top - current.scroller.scrollTop);
    current.offsets = {};
    setDragView({
      id,
      game: games.find((game) => game.instanceId === id),
      x: current.x - current.offsetX,
      y: current.y - current.offsetY,
      width: source.width,
      height: source.height,
      offsets: {},
      position: current.sourceIndex + 1,
    });
    updateTarget(current);
    const autoScroll = () => {
      if (gesture.current !== current) return;
      const bounds =
        current.scroller === document.scrollingElement
          ? { top: 0, bottom: window.innerHeight }
          : current.scroller.getBoundingClientRect();
      const speed =
        current.y < bounds.top + 36
          ? -8
          : current.y > bounds.bottom - 36
            ? 8
            : 0;
      if (speed) {
        current.scroller.scrollTop += speed;
        updateTarget(current);
      }
      current.frame = requestAnimationFrame(autoScroll);
    };
    current.frame = requestAnimationFrame(autoScroll);
  }

  function movePointer(event) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.x = event.clientX;
    current.y = event.clientY;
    if (current.active) {
      event.preventDefault();
      updateTarget(current);
    } else if (
      current.moved ||
      Math.hypot(current.x - current.startX, current.y - current.startY) > 8
    ) {
      if (current.pointerType === "touch") {
        current.moved = true;
        // An early touch swipe scrolls instead of reordering.
        clearTimeout(current.timer);
        current.scroller.scrollTop += current.lastY - current.y;
      } else {
        // Mouse and pen clicks tolerate small movements and stationary presses.
        event.preventDefault();
        startDrag(current);
      }
    }
    current.lastY = current.y;
  }

  function finishPointer(event) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    // The browser still dispatches a click after pointerup; suppress it for a hold or scroll.
    current.element.dataset.suppressClick = String(
      current.active || current.moved,
    );
    if (current.active && current.target && !disabled)
      onDrop(current.id, current.target.id, current.target.after);
    stopGesture();
  }
  const previewOrder = games.map((game) => game.instanceId);
  if (dragView) {
    const from = previewOrder.indexOf(dragView.id);
    if (from >= 0)
      previewOrder.splice(
        dragView.position - 1,
        0,
        previewOrder.splice(from, 1)[0],
      );
  }
  return (
    <nav
      ref={listRef}
      className={`worksheetActivityList ${dragView ? "activityListSorting" : ""}`}
      aria-label={t("Worksheet activities")}
    >
      <div className="activityListHeading">
        <strong>{t("Activities")}</strong>
        <span>{games.length}</span>
      </div>
      <ol>
        {games.map((game, index) => (
          <li
            key={game.instanceId}
            data-activity-id={game.instanceId}
            onPointerDown={(event) => {
              if (event.target.closest(".activityListActions")) return;
              event.currentTarget.dataset.suppressClick = "false";
              startHold(event, game.instanceId);
            }}
            onPointerMove={movePointer}
            onPointerUp={finishPointer}
            onPointerCancel={stopGesture}
            onLostPointerCapture={stopGesture}
            onContextMenu={(event) => {
              if (!event.target.closest(".activityListActions"))
                event.preventDefault();
            }}
            onDragStart={(event) => event.preventDefault()}
            onClick={(event) => {
              if (disabled || event.target.closest(".activityListActions"))
                return;
              const suppress =
                event.currentTarget.dataset.suppressClick === "true";
              event.currentTarget.dataset.suppressClick = "false";
              if (!dragView && (!suppress || event.detail === 0)) {
                event.currentTarget
                  .querySelector(".activityThumbnail")
                  .focus({ preventScroll: true });
                onSelect(game.instanceId);
              }
            }}
            className={`${selected === game.instanceId ? "activitySelected" : ""} ${dragView?.id === game.instanceId ? "activityDragging" : ""}`}
            style={
              dragView
                ? {
                    transform: `translateY(${dragView.offsets[game.instanceId] || 0}px)`,
                  }
                : undefined
            }
          >
            <div className="activityLeftRail">
              <span className="activityIndex">
                {previewOrder.indexOf(game.instanceId) + 1}
              </span>
              {selected === game.instanceId && (
                <div className="activityListActions">
                  <Button
                    aria-label={t("Duplicate activity")}
                    title={t("Duplicate activity")}
                    icon={<CopyOutlined />}
                    disabled={disabled || !!dragView}
                    onClick={() => onDuplicate(game)}
                  />
                  <Button
                    aria-label={t("Remove activity")}
                    title={t("Remove activity")}
                    icon={<DeleteOutlined />}
                    disabled={disabled || !!dragView}
                    onClick={() => onRemove(game, index)}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={disabled}
              className="activityThumbnail"
              aria-pressed={selected === game.instanceId}
              title={t("Hold to reorder")}
              onKeyDown={(event) => {
                if (!event.altKey || disabled || dragView) return;
                const offset =
                  event.key === "ArrowUp"
                    ? -1
                    : event.key === "ArrowDown"
                      ? 1
                      : 0;
                const target = games[index + offset];
                if (offset && target) {
                  event.preventDefault();
                  onDrop(game.instanceId, target.instanceId, offset > 0);
                }
              }}
              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
            >
              <span className="activityMiniature" aria-hidden="true">
                {game.imageAssetId ? (
                  <img
                    src={`/api/minigame-assets/${game.imageAssetId}/content`}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  gameRegistry[game.id].symbol
                )}
              </span>
              <span>{t(game.name)}</span>
            </button>
          </li>
        ))}
      </ol>
      <Button
        type="primary"
        icon={<PlusOutlined aria-hidden="true" />}
        disabled={disabled || !!dragView}
        onClick={onAdd}
      >
        {t("Add activity")}
      </Button>
      {dragView &&
        createPortal(
          <div
            className="activityDragPreview"
            aria-hidden="true"
            style={{
              width: dragView.width,
              height: dragView.height,
              transform: `translate3d(${dragView.x}px, ${dragView.y}px, 0)`,
            }}
          >
            <div className="activityLeftRail">
              <span className="activityIndex">{dragView.position}</span>
            </div>
            <div className="activityThumbnail">
              <span className="activityMiniature">
                {dragView.game.imageAssetId ? (
                  <img
                    src={`/api/minigame-assets/${dragView.game.imageAssetId}/content`}
                    alt=""
                  />
                ) : (
                  gameRegistry[dragView.game.id].symbol
                )}
              </span>
              <span>{t(dragView.game.name)}</span>
            </div>
          </div>,
          document.body,
        )}
    </nav>
  );
}
