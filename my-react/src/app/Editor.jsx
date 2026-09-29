import { useResource } from "./useResource.js";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Input, Modal } from "antd";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Link, useBlocker, useParams } from "react-router-dom";
import { api } from "../api/platform.js";
import { useApp } from "./state.js";
import { EmptyState, ErrorNotice, Resource } from "./ui.jsx";
import { gameRegistry, gameTitle, saveDraft } from "./game-model.js";
import { Configuration } from "./Configuration.jsx";
import { Game } from "./Game.jsx";
import { AssignModal, ShareModal } from "./Pages.jsx";
export function Editor() {
  const { worksheetId } = useParams();
  const resource = useResource(async () => {
    const [worksheet, definitions] = await Promise.all([
      api.worksheet(worksheetId),
      api.definitions(),
    ]);
    return { worksheet, definitions };
  }, [worksheetId]);
  return (
    <Resource resource={resource}>
      {(data) => <EditorContent key={worksheetId} {...data} />}
    </Resource>
  );
}
function EditorContent({ worksheet, definitions }) {
  const { t, user } = useApp();
  const [draft, setDraft] = useState(() => ({
    ...worksheet,
    items: worksheet.items.map((item) => ({
      ...item,
      key: String(item.id),
      definition:
        item.definition || definitions.find((d) => d.id === item.miniGameId),
    })),
  }));
  const [selected, setSelected] = useState(draft.items[0]?.key);
  const [removed, setRemoved] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [preview, setPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const saveRef = useRef(null);
  const lock = useRef(false);
  const blocker = useBlocker(dirty);
  const active = draft.items.find((item) => item.key === selected);
  function update(change) {
    setDraft((current) => ({ ...current, ...change }));
    setDirty(true);
  }
  function updateItem(key, change) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.key === key ? { ...item, ...change } : item,
      ),
    }));
    setDirty(true);
  }
  async function save() {
    if (lock.current || !draft.name.trim()) return false;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await saveDraft(
        api,
        draft.id,
        draft,
        removed,
        (key, saved) =>
          setDraft((current) => ({
            ...current,
            items: current.items.map((item) =>
              item.key === key ? { ...item, ...saved } : item,
            ),
          })),
        (id) =>
          setRemoved((current) => current.filter((value) => value !== id)),
      );
      setDirty(false);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const shortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!e.repeat) saveRef.current?.();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function add(definition) {
    const key = crypto.randomUUID();
    update({
      items: [
        ...draft.items,
        {
          key,
          miniGameId: definition.id,
          definition,
          configuration: structuredClone(definition.defaultConfiguration || {}),
        },
      ],
    });
    setSelected(key);
    setModal(null);
  }
  function move(index, direction) {
    const items = [...draft.items];
    [items[index], items[index + direction]] = [
      items[index + direction],
      items[index],
    ];
    update({ items });
  }
  async function openPublish(type) {
    if (!dirty || (await save())) setModal(type);
  }
  return (
    <>
      <div className="editor-top">
        <Link to="/sheets">
          <ArrowLeft size={17} />
          {t("Worksheets")}
        </Link>
        <div className="actions">
          <span
            className={dirty ? "save-state dirty" : "save-state"}
            role="status"
          >
            {t(busy ? "Saving…" : dirty ? "Unsaved changes" : "Saved")}
          </span>
          <Button
            icon={<Eye size={16} />}
            disabled={!draft.items.length || busy}
            onClick={() => {
              setPreview(true);
              setPreviewIndex(0);
            }}
          >
            {t("Preview")}
          </Button>
          <Button
            icon={<Save size={16} />}
            type="primary"
            loading={busy}
            disabled={!draft.name.trim()}
            onClick={save}
          >
            {t("Save")}
          </Button>
        </div>
      </div>
      <ErrorNotice error={error} />
      <div className="editor-heading">
        <label className="grow">
          <span className="eyebrow">{t("Worksheet name")}</span>
          <Input
            variant="borderless"
            aria-label={t("Worksheet name")}
            className="worksheet-name"
            value={draft.name}
            disabled={busy}
            maxLength={150}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        {user.role === "TEACHER" && (
          <div className="actions">
            <Button
              disabled={busy || !draft.items.length}
              onClick={() => openPublish("share")}
            >
              {t("Share")}
            </Button>
            <Button
              disabled={busy || !draft.items.length}
              onClick={() => openPublish("assign")}
            >
              {t("Assign")}
            </Button>
          </div>
        )}
      </div>
      <fieldset disabled={busy} className="editor-fieldset">
        <div className="editor-grid">
          <aside className="panel activity-list">
            <div className="section-title">
              <h2>{t("Activity collection")}</h2>
              <span>{draft.items.length}</span>
            </div>
            {draft.items.map((item, i) => (
              <div
                key={item.key}
                className={`activity-row ${selected === item.key ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className="activity-select"
                  onClick={() => setSelected(item.key)}
                >
                  <span
                    className={`game-symbol ${gameRegistry[item.definition?.type]?.tone || ""}`}
                  >
                    {gameRegistry[item.definition?.type]?.symbol || "?"}
                  </span>
                  <span>
                    <strong>{gameTitle(item.definition, t)}</strong>
                    <small>
                      {t("Activity")} {i + 1} · v
                      {item.definition?.version || "?"}
                    </small>
                  </span>
                </button>
                <div className="activity-controls">
                  <Button
                    size="small"
                    type="text"
                    aria-label={t("Move up")}
                    icon={<ArrowUp size={14} />}
                    disabled={i === 0 || busy}
                    onClick={() => move(i, -1)}
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label={t("Move down")}
                    icon={<ArrowDown size={14} />}
                    disabled={i === draft.items.length - 1 || busy}
                    onClick={() => move(i, 1)}
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    aria-label={t("Remove")}
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      if (item.id) setRemoved((ids) => [...ids, item.id]);
                      const items = draft.items.filter(
                        (v) => v.key !== item.key,
                      );
                      update({ items });
                      if (selected === item.key) setSelected(items[0]?.key);
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              className="add-activity"
              block
              type="dashed"
              icon={<Plus size={17} />}
              onClick={() => setModal("add")}
            >
              {t("Add activity")}
            </Button>
          </aside>
          <section className="panel configuration-panel">
            {active ? (
              <>
                <div className="configuration-title">
                  <span
                    className={`game-symbol large ${gameRegistry[active.definition?.type]?.tone || ""}`}
                  >
                    {gameRegistry[active.definition?.type]?.symbol || "?"}
                  </span>
                  <div>
                    <p className="eyebrow">{t("Make it your own")}</p>
                    <h2>{gameTitle(active.definition, t)}</h2>
                  </div>
                </div>
                {active.definition?.active === false && (
                  <Alert type="info" title={t("Inactive version")} />
                )}
                <Configuration
                  key={active.key}
                  item={active}
                  canUpload={user.role === "TEACHER" || user.role === "ADMIN"}
                  onChange={(configuration) =>
                    updateItem(active.key, { configuration })
                  }
                />
              </>
            ) : (
              <EmptyState
                title="Choose an activity"
                description="Select an activity to configure it."
              >
                <Button type="primary" onClick={() => setModal("add")}>
                  {t("Add activity")}
                </Button>
              </EmptyState>
            )}
          </section>
        </div>
      </fieldset>
      <Modal
        open={modal === "add"}
        title={t("Choose an activity")}
        footer={null}
        onCancel={() => setModal(null)}
        width={720}
      >
        <div className="catalog-grid">
          {definitions.map((definition) => (
            <button
              type="button"
              className="catalog-card"
              key={definition.id}
              onClick={() => add(definition)}
            >
              <span
                className={`game-symbol large ${gameRegistry[definition.type]?.tone || ""}`}
              >
                {gameRegistry[definition.type]?.symbol || "?"}
              </span>
              <strong>{gameTitle(definition, t)}</strong>
              <p>
                {t(
                  gameRegistry[definition.type]?.description ||
                    definition.description ||
                    "This activity is preserved, but this app cannot play it yet.",
                )}
              </p>
              <small>
                {t("Version")} {definition.version}
              </small>
            </button>
          ))}
        </div>
      </Modal>
      {modal === "share" && (
        <ShareModal worksheetId={draft.id} onClose={() => setModal(null)} />
      )}{" "}
      {modal === "assign" && (
        <AssignModal worksheetId={draft.id} onClose={() => setModal(null)} />
      )}
      <Modal
        open={preview}
        title={t("Preview")}
        footer={null}
        onCancel={() => setPreview(false)}
        width={800}
        destroyOnHidden
      >
        <Alert type="info" title={t("Preview only — progress is not saved.")} />
        {draft.items[previewIndex] ? (
          <>
            <Game
              key={`${previewIndex}-${preview}`}
              item={draft.items[previewIndex]}
              preview
              onComplete={() => setPreviewIndex((i) => i + 1)}
            />
            <Button onClick={() => setPreviewIndex((i) => i + 1)}>
              {t("Skip activity")}
            </Button>
          </>
        ) : (
          <Button onClick={() => setPreview(false)}>
            {t("Back to editor")}
          </Button>
        )}
      </Modal>
      <Modal
        open={blocker.state === "blocked"}
        title={t("Leave without saving?")}
        onCancel={() => blocker.reset?.()}
        onOk={() => blocker.proceed?.()}
        okText={t("Leave")}
        cancelText={t("Stay")}
      >
        <p>{t("Unsaved changes")}</p>
      </Modal>
    </>
  );
}
