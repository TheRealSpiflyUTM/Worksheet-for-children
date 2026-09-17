# Backend

Three separate modules: `minigame1`, `countmatch`, and `auth`.

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

## 3. Authentication (signup and login)

```text
React form -> AuthController -> AuthService -> UserRepository -> data/auth/users.mv.db
```

The `com.worksheet.auth` package owns the entire authentication module.
It uses its own H2 file, without changing the minigame database or controllers.
The database and table are created automatically at backend startup.

| File | Responsibility |
| --- | --- |
| `AuthController.java` | Signup, login, current user, logout, and session creation |
| `AuthService.java` | Validate input and check credentials |
| `UserRepository.java` | Read/write the separate user database with parameterized SQL |
| `PasswordHasher.java` | Salt and hash passwords with PBKDF2-HMAC-SHA256 |
| `AuthUser.java` | Public account fields returned to the browser |

The `auth_users` table stores `id`, `name`, `email`, `password_hash`, and
`created_at`. Emails are trimmed, lowercased, and unique. Names must contain
1–100 characters, emails at most 254, and passwords 15–128 characters.
Passwords are never returned or stored as plain text. Each hash has a random
salt and 600,000 iterations, following the
[OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

| Request | JSON body | Result |
| --- | --- | --- |
| `POST /api/auth/signup` | `name`, `email`, `password` | `201`: account created and signed in |
| `POST /api/auth/login` | `email`, `password` | `200`: signed in |
| `GET /api/auth/me` | None | `200`: current user, or `401`: signed out |
| `POST /api/auth/logout` | `{}` | `204`: session invalidated |

Signup, login, and current-user responses contain only `id`, `name`, `email`,
and `createdAt`. Invalid input returns `400`, incorrect credentials return
`401`, and duplicate email returns `409`. Expected errors include a `message`.

Sessions use an HttpOnly, SameSite=Strict cookie scoped to `/api/auth`.
The session ID changes after authentication. Sessions expire after 30 minutes
without an auth request, or when the backend restarts; accounts remain saved.
The frontend keeps no password or token in local storage.

All POST requests require `X-Auth-Request: 1`. Authentication endpoints do not
enable cross-origin requests, and reject browser requests marked cross-site.
This follows the [OWASP custom-header CSRF pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi).

### Run with the React app

1. Start this backend from `backend/backend` using the command above.
2. In another terminal, open `my-react` and run `npm install`, then `npm run dev`.
3. Open the Vite URL, choose **Create an account**, and sign up.
4. Refresh to check the session; log out and log back in to check saved credentials.

`my-react/src/auth/authService.js` handles the four requests. `AuthGate.jsx`
owns the login/signup screens and session state. `src/main.jsx` wraps the
existing app once. Vite proxies only `/api/auth` to port 8080.
The separate older frontend in `Project/frontend` is unchanged.

The login screen gates the React app, but existing minigame APIs remain public
to preserve their current behavior. Teacher/kid switching is not account-level
authorization. No roles, email verification, password reset, or login rate
limiting are included in this initial module. Before public deployment, add
rate limiting, serve over HTTPS, set `AUTH_COOKIE_SECURE=true`, and configure
the web server to proxy `/api/auth` to the backend under the same origin.
Vite's proxy is for development only.

### Checks

Run `.\mvnw.cmd test` here and `npm run build` in `my-react`.
Authentication tests use temporary databases, not real user data.

## Frontend notes

- Add `http://localhost:8080` before an image URL to display it.
- Browser requests are allowed from `http://localhost:5173`.
- `400` means invalid input; `404` means not found; `500` means a backend error.
- Backend settings are in `src/main/resources/application.properties`.
