import { useEffect, useRef, useState } from "react";
import { Alert, Button, Modal, Upload } from "antd";
import { UploadOutlined, PictureOutlined } from "@ant-design/icons";
import { platformApi } from "../api/platform.js";
import { setAtPath } from "../platform/game-model.js";
import { usePlatform } from "../platform/PlatformState.js";
import { photoUrl } from "../lib/task-images.js";
import "./ActivityPhotos.css";

export function ActivityPhoto({ assetId }) {
  const { t } = usePlatform();
  return assetId ? (
    <figure className="activityPhoto">
      <img src={photoUrl(assetId)} alt={t("Activity photo")} />
    </figure>
  ) : null;
}

function PhotoField({
  definition,
  slot,
  value,
  fallback,
  label,
  onChange,
  onBusyChange,
}) {
  const { t } = usePlatform();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [library, setLibrary] = useState(false);
  const [page, setPage] = useState(0);
  const [images, setImages] = useState(null);
  const locked = useRef(false);

  useEffect(() => {
    if (!library) return;
    let active = true;
    platformApi.images(page).then(
      (value) => {
        if (active) setImages(value);
      },
      (error) => {
        if (active) setError(error);
      },
    );
    return () => {
      active = false;
    };
  }, [library, page]);

  async function upload(file) {
    if (locked.current) return false;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError(
        new Error(t("Choose a JPG, PNG, WebP or GIF image up to 10 MB.")),
      );
      return false;
    }
    locked.current = true;
    setBusy(true);
    setError(null);
    onBusyChange(true);
    try {
      onChange((await platformApi.upload(definition.id, slot, file)).id);
    } catch (error) {
      setError(error);
    } finally {
      locked.current = false;
      setBusy(false);
      onBusyChange(false);
    }
    return false;
  }
  const src = photoUrl(value, fallback);
  return (
    <section className="activityPhotoField" aria-label={label}>
      <strong>{label}</strong>
      {error && <Alert type="error" title={error.message} />}
      <Upload.Dragger
        accept="image/png,image/jpeg,image/webp,image/gif"
        beforeUpload={upload}
        showUploadList={false}
        disabled={busy}
        multiple={false}
        openFileDialogOnClick={false}
      >
        {src ? (
          <img className="photoFieldPreview" src={src} alt={label} />
        ) : (
          <PictureOutlined className="photoPlaceholder" />
        )}
        <small>
          {t("Drop a photo here · JPG, PNG, WebP, GIF · Up to 10 MB")}
        </small>
      </Upload.Dragger>
      <div className="photoFieldActions">
        <Upload
          accept="image/png,image/jpeg,image/webp,image/gif"
          beforeUpload={upload}
          showUploadList={false}
          disabled={busy}
        >
          <Button
            aria-label={t(value ? "Replace photo" : "Upload photo")}
            icon={<UploadOutlined aria-hidden="true" />}
            loading={busy}
          >
            {t(value ? "Replace photo" : "Upload photo")}
          </Button>
        </Upload>
        <Button
          disabled={busy}
          onClick={() => {
            setError(null);
            setImages(null);
            setLibrary(true);
          }}
        >
          {t("My photos")}
        </Button>
        {value && (
          <Button disabled={busy} onClick={() => onChange(null)}>
            {t("Remove photo")}
          </Button>
        )}
      </div>

      <Modal
        title={t("My photos")}
        open={library}
        footer={null}
        onCancel={() => setLibrary(false)}
      >
        {error && <Alert type="error" title={error.message} />}
        {!images ? (
          <p role="status">{t("Loading…")}</p>
        ) : (
          <>
            {!images.items.length && (
              <p>{t("Upload your first photo to use it again here.")}</p>
            )}
            <div className="photoLibraryGrid">
              {images.items.map((image) => (
                <button
                  type="button"
                  aria-label={image.originalFilename}
                  key={image.id}
                  onClick={() => {
                    onChange(image.id);
                    setLibrary(false);
                  }}
                >
                  <img src={image.url} alt={image.originalFilename} />
                  <span>{image.originalFilename}</span>
                </button>
              ))}
            </div>
            {images.totalElements > 20 && (
              <div className="photoLibraryPages">
                <Button disabled={page === 0} onClick={() => setPage(page - 1)}>
                  {t("Previous")}
                </Button>
                <Button
                  disabled={(page + 1) * 20 >= images.totalElements}
                  onClick={() => setPage(page + 1)}
                >
                  {t("Next")}
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </section>
  );
}

export default function ActivityPhotos({
  game,
  definition,
  onChange,
  onBusyChange,
}) {
  const { t } = usePlatform();
  const slots = definition?.configurationSchema?.["x-image-slots"];
  if (!slots?.["activity-photo"]?.allowUpload) return null;
  const collection =
    game.id === "color-game"
      ? "animals"
      : game.id === "matching-game"
        ? "pairs"
        : null;
  return (
    <div className="activityPhotos">
      <PhotoField
        definition={definition}
        slot="activity-photo"
        value={game.imageAssetId}
        label={t("Activity photo")}
        onChange={(value) => onChange(setAtPath(game, ["imageAssetId"], value))}
        onBusyChange={onBusyChange}
      />
      {collection && slots["object-photo"]?.allowUpload && (
        <div className="objectPhotoFields">
          {game[collection]?.map((entry, index) => (
            <PhotoField
              key={entry.id}
              definition={definition}
              slot="object-photo"
              value={entry.imageAssetId}
              fallback={entry.img}
              label={entry.name || t("Pair {number}", { number: index + 1 })}
              onChange={(value) =>
                onChange(
                  setAtPath(game, [collection, index, "imageAssetId"], value),
                )
              }
              onBusyChange={onBusyChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
