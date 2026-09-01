# Kelo Typing Engine — Server (auth + database + multiplayer)

Merge of `feature/auth-api` (JWT + Google OAuth + MongoDB users) into
`refactor/backend-websockets` (the Socket.IO solo-typing engine), plus a new
room-based multiplayer layer on top of both.

## What changed vs. the two source branches

- **Real auth everywhere.** The websockets branch's `MOCK_AUTH_TOKEN` dev
  bypass is gone. Every socket connection must present a JWT
  (`socket.handshake.auth.token`) issued by `POST /api/auth/register`,
  `/api/auth/login`, or `/api/auth/google`. `middlewares/authMiddleware.ts`
  now verifies it and loads the user from Mongo before any handler runs.
- **Database wired in.** `config/database.config.ts` connects Mongoose to
  `MONGO_URI` before the HTTP/Socket.IO server starts listening (see
  `index.ts`). `User` and `Result` models are ported from the auth branch;
  a new `Match` model persists finished multiplayer races.
- **Multiplayer rooms — new.** Neither branch had this; the websockets
  branch's README described "multi-user typing sessions" but only
  implemented `start_solo_session` / `typing_progress`. Added:
  `controllers/room.service.ts` (in-memory room/player state, per-player
  anti-cheat, countdown, DB persistence on finish) and
  `controllers/room.socket.ts` (the socket event handlers).
- **REST routes merged.** `/api/auth/*` and `/api/results/*` (solo results +
  leaderboard) from the auth branch now sit alongside `/api/prompts/*` from
  the websockets branch, behind the same helmet/cors/rate-limit stack.

## Multiplayer flow

1. Client connects to Socket.IO with a JWT.
2. `create_room` → gets a 5-character room code back via `room_state`.
3. Other players `join_room({ code })`.
4. Everyone (except the host, who starts ready) sends `toggle_ready`.
5. Once ≥2 players are all ready, the server auto-starts a
   `room_countdown` (`ROOM_COUNTDOWN_SECONDS`), then emits `race_started`
   with the shared prompt.
6. Players send `race_progress({ typedIndex, correctCharacters })`
   periodically; the room broadcasts `race_progress_update` to everyone and
   `player_finished` (with placement) as each player completes the prompt.
7. Once everyone finishes (or a grace period after the first finisher
   elapses), the server persists a `Match` document, updates each `User`'s
   `bestWpm` / `matchesPlayed` / `matchesWon`, and emits `race_summary`.

Full event/type contracts: `src/models/typing.types.ts`.

## API docs (Swagger)

Interactive docs at **`GET /api-docs`** once the server is running, raw
OpenAPI 3.0 JSON at `GET /api-docs.json`. Covers every REST route (auth,
results, prompts, health) with request/response schemas and a `bearerAuth`
scheme wired to the `/api/auth/*` endpoints — click "Authorize" in the UI
and paste the JWT from `/login` or `/register` to try protected routes
in-browser. Socket.IO events aren't representable in OpenAPI, so they're
documented in the "Multiplayer flow" section above and in
`src/models/typing.types.ts` instead; the docs page links there.

## Setup

```bash
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev             # tsx --watch
npm run build && npm start   # production
npm run typecheck
```

## REST endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Create a local account |
| POST | `/api/auth/login` | — | Local login |
| POST | `/api/auth/google` | — | Google ID-token login/signup |
| GET | `/api/auth/me` | Bearer | Current user |
| POST | `/api/results` | Bearer | Save a solo test result |
| GET | `/api/results/me` | Bearer | Your solo result history |
| GET | `/api/results/leaderboard` | — | Public solo leaderboard |
| GET | `/api/prompts/random` | — | Random text prompt |
| GET | `/api/prompts/:id` | — | Prompt by id |
| GET | `/health` | — | DB status, active solo sessions, active rooms |
