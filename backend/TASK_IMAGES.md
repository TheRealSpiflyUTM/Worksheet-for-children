# Dynamic task images: backend contract

Task images are opt-in per minigame definition version. Teachers can upload their own images, select
admin-provided variants, or use both, depending on the definition. No frontend changes are included.
All existing worksheet configuration endpoints and game types remain compatible.

## 1. Declare image slots when creating a definition (admin)

Use the existing `POST /api/minigames` definition API. Add `x-image-slots` at the **root** of
`configurationSchema`. Slots describe where asset IDs belong in a task's configuration, independently
of JSON Schema composition (`$ref`, `oneOf`, etc.). No new Java class or endpoint is needed per game.

Example request (replace asset IDs with real images uploaded through the admin asset API):

```json
{
  "name": "Count the objects",
  "type": "count-objects",
  "version": 1,
  "assets": { "apples": 41, "cats": 42 },
  "configurationSchema": {
    "type": "object",
    "required": ["tasks"],
    "additionalProperties": false,
    "properties": {
      "tasks": {
        "type": "array",
        "maxItems": 20,
        "items": {
          "type": "object",
          "required": ["question", "imageAssetId"],
          "additionalProperties": false,
          "properties": {
            "question": { "type": "string", "maxLength": 200 },
            "imageAssetId": { "type": "integer", "minimum": 1 }
          }
        }
      }
    },
    "x-image-slots": {
      "task-picture": {
        "path": "/tasks/*/imageAssetId",
        "label": "Objects to count",
        "allowUpload": true,
        "variants": ["apples", "cats"]
      }
    }
  },
  "defaultConfiguration": { "tasks": [] }
}
```

Slot behavior:

| Declaration | Behavior |
| --- | --- |
| No `x-image-slots`, or `{}` | No managed image slots or teacher uploads for this definition |
| `allowUpload: true`, no variants | Teacher uploads/reuses their own images |
| `variants: ["apples", "cats"]`, no `allowUpload` | Select only the named catalog images |
| Both | Upload or select a catalog image |

Each slot key is a stable lowercase identifier (letters/numbers separated by `.`, `_`, or `-`).
`label` is optional and defaults to the key; `allowUpload` defaults to false; `variants` defaults to
an empty list. A slot must enable at least one source. Variant keys must exist in the definition's
`assets` map and refer to active image assets. Defaults can reference only that slot's catalog variants,
so they work for every teacher. Referenced definition versions remain immutable; create a new version
to change their slots or variants.

Paths are absolute property paths with array wildcards, not arbitrary JSONPath expressions:

- `/imageAssetId`: one image for the whole task configuration.
- `/tasks/*/imageAssetId`: a different image per question/task.
- `/tasks/*/variants/*/imageAssetId`: multiple image variants per task.
- `/imageAssetIds/*`: a list of images.

Property names in paths use letters/underscores followed by letters, digits, underscores or hyphens.
`*` matches array elements only. Numeric array indices, escaped property names and object wildcards
are intentionally unsupported. Paths must be unique. Up to 32 slots and 100 catalog options per slot
are supported. Nested paths allow arrays of tasks and variants without hardcoding a game's structure.

Missing/null image fields are skipped by asset validation; JSON Schema controls whether they are
required or nullable. Use its `required`, `type`, `minItems`, `maxItems`, `enum`, etc. for task rules.
Only fields declared in `x-image-slots` are managed image references. Use `additionalProperties: false`
where appropriate to reject undeclared configuration fields. The extension belongs at the schema root;
putting annotations in nested subschemas does not create slots.

## 2. Discover fields and available variants

Authenticated request:

```http
GET /api/minigames/{definitionId}/image-slots
```

Example response:

```json
[
  {
    "key": "task-picture",
    "path": "/tasks/*/imageAssetId",
    "label": "Objects to count",
    "allowUpload": true,
    "acceptedContentTypes": ["image/png", "image/jpeg", "image/gif", "image/webp"],
    "maxUploadBytes": 10485760,
    "variants": [
      { "key": "apples", "assetId": 41, "filename": "apples.png", "contentType": "image/png", "url": "/api/minigame-assets/41/content" },
      { "key": "cats", "assetId": 42, "filename": "cats.png", "contentType": "image/png", "url": "/api/minigame-assets/42/content" }
    ]
  }
]
```

The editor can show an upload button only if `allowUpload` is true and a picker only if `variants`
is nonempty. `[]` means the game does not offer images. Raw declarations are also present in existing
definition responses under `configurationSchema`. Deactivated definitions are not available through
this authoring endpoint; existing saved tasks/revisions and their images remain usable.

## 3. Upload a teacher image, or reuse an existing upload

Teacher/admin request with the usual session cookie and CSRF header:

```http
POST /api/minigames/{definitionId}/image-slots/{slotKey}/uploads
Content-Type: multipart/form-data; boundary=...

file: <binary PNG, JPEG, GIF or WebP>
```

Returns `201` with the existing asset response (`id`, `url`, `originalFilename`, `contentType`,
`sizeBytes`, `sha256`, `status`, `createdAt`). The image bytes are saved through `MiniGameAssetStorage`;
local disk under `app.minigame-asset-directory` is the current implementation. File type is detected
from content signatures, not the filename or supplied MIME type. Files are limited to 10 MiB;
the multipart request limit is 11 MiB to allow form overhead. Audio is rejected by this endpoint.

The upload does not modify a worksheet. Save its returned ID into the selected task next. Cancelled
uploads remain in the teacher's image library and can be reused or deleted. Own images can be reused
across any upload-enabled slot; selecting an ID is still validated when saving the task.

```http
GET /api/minigame-assets?page=0&size=20
```

Returns `{ "items": [<asset response>], "page": 0, "size": 20, "totalElements": 1 }`.
Only the current teacher/admin's active images are listed, newest first. Pages start at zero;
size must be 1–100. An admin also sees only their own library. Catalog options are obtained from the
slot endpoint, not this library. The existing unscoped `POST /api/minigame-assets` stays admin-only.

## 4. Save task configuration

Use the existing item create/update endpoints:

```http
POST /api/worksheets/{worksheetId}/items
PUT /api/worksheets/{worksheetId}/items/{itemId}
Content-Type: application/json
```

```json
{
  "miniGameId": 12,
  "orderIndex": 1,
  "configuration": {
    "tasks": [
      { "question": "Count my objects", "imageAssetId": 99 },
      { "question": "Count the cats", "imageAssetId": 42 }
    ]
  }
}
```

Each image reference must be an active image, and either the worksheet owner's upload in an
upload-enabled slot or a permitted catalog variant for that slot. Other teachers' private uploads,
audio, nonexistent/deleted IDs and disallowed choices are rejected. Image values must be positive
integer asset IDs, not URLs or Base64 strings. Save failures roll back configuration/reference changes.

Existing worksheet and attempt responses preserve these IDs in `configuration`. To display an image,
use `GET /api/minigame-assets/{id}/content` with an authenticated session. This retains the existing
asset-content access model: authenticated players can retrieve image URLs; the new library listing
is owner-scoped, but content URLs are not a private file-sharing mechanism.

## 5. Lifecycle and errors

`DELETE /api/minigame-assets/{id}` permits teachers to remove their own unused images and admins to
remove unused assets. It returns `409` when a catalog link, thumbnail, worksheet draft or published
revision still references the asset. Replacing/removing a draft image releases that draft's reference.
Published snapshots retain their references, even after draft edits or deletion. Students cannot
upload, list upload libraries or delete assets. Images remain available after definition deactivation.

Common responses: `400` invalid policy/configuration/file/choice; `401` no session; `403` forbidden role,
other owner's deletion, or upload into a choice-only slot; `404` missing/inactive definition, missing
slot or unavailable asset; `409` asset still in use. Servlet upload-size enforcement can return `413`.

Migration `V20__track_task_image_assets.sql` adds indexed reference tables for draft and revision
items. Existing definitions have no slots and need no data backfill. Asset rows are locked during
reference creation/deletion to avoid deleting a file while another request saves a reference.
Keep the asset directory on persistent storage and back it up with the database.
