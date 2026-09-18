# Count & Match backend

This feature lives in `com.worksheet.countmatch`, beside `minigame1`, and is independent of it.
It reads the prepared PNG files directly; no database tables or uploads are needed.

## Run

From `backend`, run:

```powershell
.\mvnw.cmd spring-boot:run
```

The default image folder is `data/Count & Mathc (MiniGame)/Images` (the existing folder spelling).
Change `app.count-match.image-directory` in `src/main/resources/application.properties` if needed.
Relative paths are resolved from the directory where you start the backend.

## Frontend API

| Request | Response |
| --- | --- |
| `GET /api/count-match/categories` | `["animals", "fruits", "shapes", "toys", "vegetables"]` |
| `GET /api/count-match/images?category=vegetables&count=5` | Array of 5 randomly selected, distinct image URL strings |
| `GET /api/count-match/images/fruits/image-r1-c1.png` | The PNG image itself |

Use the lowercase category values above. Both `category` and `count` are required.
`count` must be a positive integer no larger than the number of available PNGs.
Missing parameters or an invalid count return 400, including requests for more images than exist.
Unknown categories and missing images return 404. An unreadable or missing category folder returns 500.
An empty category folder cannot satisfy a positive count and returns 400. Only PNG files are included.
Each request makes a fresh random selection without duplicates; separate requests may overlap.

Example from the frontend running on `http://localhost:5173`:

```javascript
const backend = 'http://localhost:8080';
const response = await fetch(`${backend}/api/count-match/images?category=vegetables&count=5`);
if (!response.ok) throw new Error('Could not load images');
const imagePaths = await response.json();
const images = imagePaths.map(path => `${backend}${path}`);
// Use an entry from images as an <img> src.
```

The URLs are relative to the backend, so prefix them with the backend origin when
the frontend runs on a different port. CORS allows the existing Vite origin above.

## How it works

1. The controller receives the frontend's HTTP request.
2. The service reads the category's PNG filenames, shuffles them, and selects `count` images.
3. Spring returns the list as a JSON array. Each URL loads one image.

The frontend chooses images and counts, repeats an image to form each object group,
displays the number choices, and manages connections, correct answers, and completion.
This backend step supplies the images only.

Add PNG files to an existing category folder and they appear on the next request.
To add a category, add its lowercase name to `CATEGORIES` in `CountMatchService`
and create a folder with the first letter capitalized.

