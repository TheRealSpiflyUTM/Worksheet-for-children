# Backend

Two separate minigames: `minigame1` and `countmatch`.

## Run

Open a terminal in `backend/backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend address: `http://localhost:8080`.

## How the code works

- **Controller** receives requests from the frontend.
- **Service** does the work and prepares the response.
- **Repository** saves and reads database records (Minigame1 only).

## 1. Minigame1

Saves an animal name and an uploaded image.

```text
Frontend -> Controller -> Service -> Database + image folder
```

Records are in `data/database`. Images are in `data/uploads`.

| Request | Send | Receive |
| --- | --- | --- |
| `POST /api/minigame1` | Form data: `name` and `image` file | Saved entry |
| `GET /api/minigame1` | Nothing | Array of saved entries |
| `GET /api/minigame1/{id}/image` | Entry ID in the URL | Image file |

Example saved entry:

```json
{
  "id": 1,
  "name": "Cat",
  "imageUrl": "/api/minigame1/1/image",
  "createdAt": "2026-09-15T19:00:00Z"
}
```

## 2. Count & Match

Returns random images from a category.

```text
Frontend -> Controller -> Service -> Prepared image folders
```

Images are in `data/Count & Mathc (MiniGame)/Images`.

Categories: `animals`, `fruits`, `shapes`, `toys`, `vegetables`.

| Request | Receive |
| --- | --- |
| `GET /api/count-match/categories` | Array of category names |
| `GET /api/count-match/images?category=vegetables&count=5` | Array of 5 random image URLs, without duplicates |
| `GET /api/count-match/images/{category}/{filename}` | Image file |

Example response when `count=2`:

```json
[
  "/api/count-match/images/vegetables/image-r1-c1.png",
  "/api/count-match/images/vegetables/image-r3-c2.png"
]
```

Both `category` and `count` are required. Count must be at least 1 and cannot
exceed the available images. The frontend handles counting and matching.

## Frontend notes

- Add `http://localhost:8080` before an image URL to display it.
- Browser requests are allowed from `http://localhost:5173`.
- `400` means invalid input; `404` means not found; `500` means a backend error.
- Backend settings are in `src/main/resources/application.properties`.
