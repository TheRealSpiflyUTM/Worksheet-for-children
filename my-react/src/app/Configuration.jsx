import { useResource } from "./useResource.js";
import { useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from "antd";
import { ImagePlus, Upload } from "lucide-react";
import { api } from "../api/platform.js";
import { useApp } from "./state.js";
import { EmptyState, ErrorNotice, Resource } from "./ui.jsx";
import { imagePaths, setAtPath } from "./game-model.js";
const fieldNames = {
  maxNumber: "Maximum number",
  exerciseCount: "Number of questions",
  operations: "Operations",
  letter: "Letter",
  animals: "Picture words",
  name: "Name",
  img: "Image URL",
};
function defaultValue(schema) {
  if (schema.default !== undefined) return structuredClone(schema.default);
  if (schema.enum) return schema.enum[0];
  if (schema.type === "object")
    return Object.fromEntries(
      Object.entries(schema.properties || {})
        .filter(([key]) => schema.required?.includes(key))
        .map(([key, value]) => [key, defaultValue(value)]),
    );
  if (schema.type === "array") return [];
  if (schema.type === "integer" || schema.type === "number")
    return schema.minimum ?? 1;
  if (schema.type === "boolean") return false;
  return "";
}
export function SchemaFields({
  schema = {},
  value = {},
  onChange,
  label,
  path = [],
  imageSlots = [],
}) {
  const { t } = useApp();
  const pointer =
    "/" + path.map((p) => (typeof p === "number" ? "*" : p)).join("/");
  if (imageSlots.some((s) => s.path === pointer)) return null;
  if (
    schema.type === "object" ||
    schema.properties ||
    (!schema.type && typeof value === "object" && !Array.isArray(value))
  ) {
    const properties =
      schema.properties ||
      Object.fromEntries(
        Object.entries(value || {}).map(([key, val]) => [
          key,
          { type: Array.isArray(val) ? "array" : typeof val },
        ]),
      );
    return (
      <div className="schema-fields">
        {Object.entries(properties)
          .filter(([key]) => key !== "id")
          .map(([key, child]) => (
            <SchemaFields
              key={key}
              schema={child}
              value={value?.[key]}
              onChange={(next) => onChange({ ...value, [key]: next })}
              label={fieldNames[key] || child.title || key}
              path={[...path, key]}
              imageSlots={imageSlots}
            />
          ))}
      </div>
    );
  }
  if (schema.type === "array") {
    if (schema.items?.enum || label === "Operations")
      return (
        <label className="field-label">
          {t(label)}
          <Checkbox.Group
            value={value || []}
            options={schema.items?.enum || ["+", "-", "*", "/"]}
            onChange={(next) => {
              if (next.length) onChange(next);
            }}
          />
        </label>
      );
    const list = Array.isArray(value) ? value : [];
    return (
      <div className="array-field">
        <h3>{t(label)}</h3>
        {list.map((entry, i) => (
          <div className="array-entry" key={entry?.id || i}>
            <SchemaFields
              schema={schema.items || { type: typeof entry }}
              value={entry}
              onChange={(next) =>
                onChange(list.map((v, j) => (j === i ? next : v)))
              }
              path={[...path, i]}
              imageSlots={imageSlots}
            />
            <Button
              size="small"
              danger
              disabled={list.length <= (schema.minItems || 0)}
              onClick={() => onChange(list.filter((_, j) => i !== j))}
            >
              {t("Remove")}
            </Button>
          </div>
        ))}
        <Button
          disabled={list.length >= (schema.maxItems || 100)}
          onClick={() => {
            const next = defaultValue(schema.items || { type: "string" });
            if (
              typeof next === "object" &&
              next !== null &&
              !Array.isArray(next) &&
              schema.items?.properties?.id
            )
              next.id = crypto.randomUUID();
            onChange([...list, next]);
          }}
        >
          {t(label === "Picture words" ? "Add word" : "Add activity")}
        </Button>
      </div>
    );
  }
  const input = schema.enum ? (
    <Select
      value={value}
      onChange={onChange}
      options={schema.enum.map((v) => ({ value: v, label: String(v) }))}
    />
  ) : schema.type === "integer" || schema.type === "number" ? (
    <InputNumber
      min={schema.minimum ?? 1}
      max={schema.maximum ?? 10000}
      precision={schema.type === "integer" ? 0 : undefined}
      value={value}
      onChange={(next) => onChange(next)}
      aria-label={t(label)}
    />
  ) : schema.type === "boolean" ? (
    <Switch checked={!!value} onChange={onChange} aria-label={t(label)} />
  ) : (
    <Input
      value={value ?? ""}
      maxLength={schema.maxLength || 500}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t(label)}
    />
  );
  return (
    <label className="field-label">
      {t(label)}
      {input}
    </label>
  );
}
function ImagePicker({ definition, slot, onSelect, onClose }) {
  const { t } = useApp();
  const [page, setPage] = useState(0);
  const library = useResource(
    () =>
      slot.allowUpload
        ? api.images(page)
        : Promise.resolve({ items: [], totalElements: 0 }),
    [page, slot.allowUpload],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function upload(file) {
    if (!file) return;
    if (
      !slot.acceptedContentTypes.includes(file.type) ||
      file.size > slot.maxUploadBytes
    ) {
      setError(
        new Error(t("This image is too large or its format is unsupported.")),
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const asset = await api.upload(definition.id, slot.key, file);
      onSelect(asset.id);
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      title={slot.label || t("Choose image")}
      footer={null}
      onCancel={onClose}
    >
      <ErrorNotice error={error} />
      {slot.allowUpload && (
        <label className="upload-control">
          <Upload size={17} />
          {t("Upload image")}
          <input
            type="file"
            aria-label={t("Upload image")}
            accept={slot.acceptedContentTypes.join(",")}
            disabled={busy}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
      )}
      {busy && <p role="status">{t("Loading…")}</p>}
      {slot.variants.length > 0 && (
        <>
          <h3>{t("Catalog images")}</h3>
          <div className="image-grid">
            {slot.variants.map((v) => (
              <button
                type="button"
                key={v.assetId}
                onClick={() => {
                  onSelect(v.assetId);
                  onClose();
                }}
              >
                <img src={v.url} alt={v.filename} />
                <span>{v.filename}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {slot.allowUpload && (
        <>
          <h3>{t("Your image library")}</h3>
          <Resource resource={library}>
            {(data) => (
              <>
                {data.items.length ? (
                  <div className="image-grid">
                    {data.items.map((image) => (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => {
                          onSelect(image.id);
                          onClose();
                        }}
                      >
                        <img src={image.url} alt={image.originalFilename} />
                        <span>{image.originalFilename}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No images yet"
                    description="Upload image"
                  />
                )}
                <div className="actions">
                  <Button
                    disabled={!page}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t("Previous")}
                  </Button>
                  <Button
                    disabled={(page + 1) * 20 >= data.totalElements}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("Next")}
                  </Button>
                </div>
              </>
            )}
          </Resource>
        </>
      )}
    </Modal>
  );
}
export function Configuration({ item, onChange, canUpload }) {
  const { t } = useApp();
  const definition = item.definition;
  const slots = useResource(
    () => (definition?.active ? api.slots(definition.id) : Promise.resolve([])),
    [definition?.id, definition?.active, canUpload],
  );
  const [picker, setPicker] = useState(null);
  if (!definition)
    return (
      <p>{t("This activity is preserved, but this app cannot play it yet.")}</p>
    );
  const declaredSlots = Object.entries(
    definition.configurationSchema?.["x-image-slots"] || {},
  ).map(([key, slot]) => ({ ...slot, key, allowUpload: false, variants: [] }));
  const availableSlots = (slots.data?.length ? slots.data : declaredSlots).map(
    (slot) => ({ ...slot, allowUpload: canUpload && slot.allowUpload }),
  );
  return (
    <>
      <ErrorNotice error={slots.error} retry={slots.reload} />
      <SchemaFields
        schema={definition.configurationSchema}
        value={item.configuration}
        onChange={onChange}
        imageSlots={availableSlots}
      />
      {availableSlots.map((slot) => (
        <div className="image-slot" key={slot.key}>
          <h3>{slot.label || t("Images")}</h3>
          {imagePaths(item.configuration, slot.path).map(({ path, value }) => (
            <div className="image-slot-row" key={path.join("/")}>
              <span>
                {path
                  .filter((p) => typeof p === "number")
                  .map((p) => p + 1)
                  .join(" · ")}
              </span>
              {value && (
                <img
                  src={`/api/minigame-assets/${value}/content`}
                  alt={slot.label || t("Images")}
                />
              )}
              {(slot.allowUpload || slot.variants.length > 0) && (
                <Button
                  icon={<ImagePlus size={17} />}
                  onClick={() => setPicker({ slot, path })}
                >
                  {t("Choose image")}
                </Button>
              )}
            </div>
          ))}
        </div>
      ))}
      {picker && (
        <ImagePicker
          definition={definition}
          slot={picker.slot}
          onClose={() => setPicker(null)}
          onSelect={(assetId) =>
            onChange(setAtPath(item.configuration, picker.path, assetId))
          }
        />
      )}
    </>
  );
}
