import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Collapse, Image, Input, InputNumber, Modal, Select, Switch, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { platformApi } from "../api/platform.js";
import { imagePaths, setAtPath } from "./game-model.js";

function defaultValue(schema = {}) {
  if (schema.default !== undefined) return structuredClone(schema.default);
  if (schema.enum) return schema.enum[0];
  if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties || {}).filter(([key]) => schema.required?.includes(key)).map(([key, child]) => [key, defaultValue(child)]));
  if (schema.type === "array") return [];
  if (schema.type === "integer" || schema.type === "number") return schema.minimum ?? 1;
  if (schema.type === "boolean") return false;
  return "";
}

function SchemaField({ schema = {}, value, onChange, label, path = [], imageSlots = [] }) {
  const pointer = `/${path.map((part) => typeof part === "number" ? "*" : part).join("/")}`;
  if (imageSlots.some((slot) => slot.path === pointer)) return null;

  if (schema.type === "object" || schema.properties) {
    return <div>{Object.entries(schema.properties || {}).filter(([key]) => key !== "id").map(([key, child]) => <SchemaField key={key} schema={child} value={value?.[key]} label={child.title || key} path={[...path, key]} imageSlots={imageSlots} onChange={(next) => onChange({ ...(value || {}), [key]: next })} />)}</div>;
  }
  if (schema.type === "array") {
    if (schema.items?.enum) return <label>{label}<Checkbox.Group value={value || []} options={schema.items.enum} onChange={(next) => next.length && onChange(next)} /></label>;
    const list = Array.isArray(value) ? value : [];
    return (
      <div className="advancedArray">
        <strong>{label}</strong>
        {list.map((entry, index) => <div className="advancedArrayItem" key={entry?.id || index}><SchemaField schema={schema.items} value={entry} path={[...path, index]} imageSlots={imageSlots} onChange={(next) => onChange(list.map((current, currentIndex) => currentIndex === index ? next : current))} /><Button size="small" danger disabled={list.length <= (schema.minItems || 0)} onClick={() => onChange(list.filter((_, currentIndex) => currentIndex !== index))}>Remove</Button></div>)}
        <Button disabled={list.length >= (schema.maxItems || 100)} onClick={() => onChange([...list, defaultValue(schema.items)])}>Add</Button>
      </div>
    );
  }
  const control = schema.enum
    ? <Select value={value} options={schema.enum.map((entry) => ({ value: entry, label: String(entry) }))} onChange={onChange} />
    : schema.type === "integer" || schema.type === "number"
      ? <InputNumber min={schema.minimum} max={schema.maximum} value={value} onChange={onChange} />
      : schema.type === "boolean"
        ? <Switch checked={!!value} onChange={onChange} />
        : <Input value={value ?? ""} maxLength={schema.maxLength || 500} onChange={(event) => onChange(event.target.value)} />;
  return <label className="advancedField"><span>{label}</span>{control}</label>;
}

function ImagePicker({ definition, slot, open, onClose, onSelect }) {
  const [images, setImages] = useState({ items: [], totalElements: 0 });
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !slot.allowUpload) return;
    platformApi.images(page).then(setImages, setError);
  }, [open, page, slot.allowUpload]);

  async function upload(file) {
    if (!slot.acceptedContentTypes.includes(file.type) || file.size > slot.maxUploadBytes) {
      setError(new Error("This image is too large or its format is unsupported."));
      return false;
    }
    setBusy(true);
    try {
      const asset = await platformApi.upload(definition.id, slot.key, file);
      onSelect(asset.id);
      onClose();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
    return false;
  }

  const choices = [...(slot.variants || []).map((variant) => ({ id: variant.assetId, url: variant.url, name: variant.filename })), ...(images.items || []).map((image) => ({ id: image.id, url: image.url, name: image.originalFilename }))];
  return (
    <Modal open={open} title={slot.label || "Choose image"} footer={null} onCancel={onClose}>
      {error && <Alert type="error" showIcon title={error.message} />}
      {slot.allowUpload && <Upload beforeUpload={upload} showUploadList={false} accept={slot.acceptedContentTypes.join(",")}><Button loading={busy} icon={<UploadOutlined />}>Upload image</Button></Upload>}
      <div className="advancedImageGrid">{choices.map((image) => <button type="button" key={image.id} onClick={() => { onSelect(image.id); onClose(); }}><Image preview={false} src={image.url} alt={image.name} /><span>{image.name}</span></button>)}</div>
      {slot.allowUpload && <div><Button disabled={!page} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button disabled={(page + 1) * 20 >= images.totalElements} onClick={() => setPage((value) => value + 1)}>Next</Button></div>}
    </Modal>
  );
}

export default function AdvancedConfiguration({ definition, configuration, onChange, canUpload }) {
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState(null);
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    if (!definition?.id || definition.active === false) return;
    platformApi.slots(definition.id).then(setSlots, setError);
  }, [definition?.id, definition?.active]);

  if (!definition?.configurationSchema) return null;
  const declared = Object.entries(definition.configurationSchema["x-image-slots"] || {}).map(([key, slot]) => ({ ...slot, key, variants: [], allowUpload: false }));
  const availableSlots = (slots.length ? slots : declared).map((slot) => ({ ...slot, allowUpload: canUpload && slot.allowUpload }));
  return (
    <Collapse
      className="advancedConfiguration"
      items={[{
        key: "configuration",
        label: "Advanced configuration & images",
        children: <>
          {error && <Alert type="error" showIcon title={error.message} />}
          <SchemaField schema={definition.configurationSchema} value={configuration} onChange={onChange} imageSlots={availableSlots} />
          {availableSlots.map((slot) => imagePaths(configuration, slot.path).map(({ path, value }) => <div className="advancedImageSlot" key={`${slot.key}-${path.join("-")}`}><span>{slot.label}</span>{value && <Image width={64} src={`/api/minigame-assets/${value}/content`} />}{(slot.allowUpload || slot.variants?.length) && <Button onClick={() => setPicker({ slot, path })}>Choose image</Button>}</div>))}
          {picker && <ImagePicker definition={definition} slot={picker.slot} open onClose={() => setPicker(null)} onSelect={(assetId) => onChange(setAtPath(configuration, picker.path, assetId))} />}
        </>,
      }]}
    />
  );
}
