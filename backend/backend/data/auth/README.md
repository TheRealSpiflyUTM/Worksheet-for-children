# User database

The backend creates `users.mv.db` here automatically on startup (run from
`backend/backend`). It is a separate H2 database from the minigames.

`auth_users` stores ID, name, normalized unique email, salted password hash,
and creation time. Real user records are ignored by Git. Do not commit or share
database files. Sessions live in server memory and end when the backend restarts.
