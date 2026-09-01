# KeloTyping — Backend

Real-time typing-speed backend: solo practice sessions **and** live multiplayer
typing races, over Socket.IO, with JWT + Google OAuth authentication and
MongoDB persistence. Backend only — no frontend included.

![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Express](https://img.shields.io/badge/Express-5.x-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [REST API](#rest-api)
- [Socket.IO API](#socketio-api)
  - [Authentication](#socket-authentication)
  - [Solo sessions](#solo-sessions)
  - [Multiplayer rooms](#multiplayer-rooms)
- [API docs (Swagger)](#api-docs-swagger)
- [Data models](#data-models)
- [Architecture notes](#architecture-notes)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Overview

This service was built by merging two parallel branches of the same project:

- **`feature/auth-api`** — real JWT + Google OAuth login, MongoDB user
  accounts, solo result persistence. No real-time layer.
- **`refactor/backend-websockets`** — a working Socket.IO engine for solo
  typing sessions (server-authoritative WPM/accuracy, anti-cheat velocity
  checks). Auth was a `MOCK_AUTH_TOKEN` stub; no database at all.

Neither branch had **multiplayer** — that's new here, built on top of both:
room creation/joining, ready-up, synced countdown, a shared prompt raced by
everyone in the room simultaneously, live progress broadcasts, placements,
and persisted match history.

## Features

- 🔐 JWT auth (register/login) + Google OAuth ID-token login
- 🗄️ MongoDB persistence via Mongoose (`User`, `Result`, `Match`)
- ⌨️ Solo typing sessions — server-computed WPM/accuracy, per-tick anti-cheat
- 🏁 Multiplayer rooms — create/join by code, ready-up, synced countdown,
  live race broadcasts, placements, persisted results
- 📊 Public leaderboard (solo best scores)
- 📖 Interactive Swagger/OpenAPI docs for the whole REST surface
- 🛡️ Helmet, CORS, rate limiting (global + auth-specific), structured
  Winston logging
- ✅ Fully typed end-to-end (TypeScript, `tsc --noEmit` clean)

## Project structure

```
server/
├── src/
│   ├── app.ts                    # Express app: middleware, routes, Swagger
│   ├── index.ts                  # Entry point: connects DB, boots HTTP + Socket.IO
│   ├── config/
│   │   ├── env.config.ts         # zod-validated environment schema
│   │   ├── database.config.ts    # Mongoose connection
│   │   └── googleAuth.config.ts  # Google ID-token verification
│   ├── controllers/
│   │   ├── auth.controller.ts    # register / login / google / me
│   │   ├── result.controller.ts  # save result / history / leaderboard
│   │   ├── typing.service.ts     # solo session engine
│   │   ├── typing.socket.ts      # solo session socket handlers
│   │   ├── room.service.ts       # multiplayer room/player state machine
│   │   └── room.socket.ts        # multiplayer socket handlers
│   ├── middlewares/
│   │   ├── authMiddleware.ts     # REST `protect` + Socket.IO auth middleware
│   │   ├── errorHandler.middleware.ts
│   │   └── rateLimiter.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── result.model.ts
│   │   ├── match.model.ts        # persisted multiplayer race results
│   │   ├── prompt.model.ts       # in-memory prompt bank
│   │   ├── typing.types.ts       # Socket.IO event contracts (client<->server)
│   │   └── typing.schema.ts      # zod validation for socket payloads
│   ├── routes/
│   │   ├── auth.route.ts
│   │   ├── result.route.ts
│   │   └── prompts.routes.ts
│   ├── docs/
│   │   └── openapi.ts            # hand-written OpenAPI 3.0 spec
│   ├── utils/
│   │   ├── generateToken.ts
│   │   ├── asyncHandler.ts
│   │   ├── errorResponse.ts      # AppError / SocketError / RoomError hierarchy
│   │   ├── wpmCalculator.ts
│   │   └── logger.ts             # Winston
│   └── types/
│       └── express.d.ts          # Request.user augmentation
├── .env.example
├── package.json
└── tsconfig.json
```

## Getting started

**Requirements:** Node.js ≥18, a reachable MongoDB instance (local or Atlas).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env — at minimum set MONGO_URI and JWT_SECRET

# 3. Run in dev mode (auto-restart on change)
npm run dev

# 4. Or build + run for production
npm run build
npm start
```

No MongoDB handy? Spin one up with Docker:
```bash
docker run -d -p 27017:27017 --name kelotyping-mongo mongo
```
then `MONGO_URI=mongodb://localhost:27017/kelotyping` in `.env`.

On successful start you'll see a `Kelo Typing Engine server started` log
with the port, environment, and config values. The server calls
`connectDB()` **before** it starts listening — if Mongo isn't reachable, it
logs the connection error and exits instead of half-starting.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `4000` | HTTP + Socket.IO port |
| `CORS_ORIGIN` | `*` | Allowed origin for REST + sockets |
| `MONGO_URI` | — | **Required.** MongoDB connection string |
| `JWT_SECRET` | — | **Required.** Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT lifetime |
| `GOOGLE_CLIENT_ID` | — | Required only if using `/api/auth/google` |
| `SESSION_TTL_MINUTES` | `15` | Solo session idle timeout |
| `CLEANUP_INTERVAL_MINUTES` | `5` | How often idle solo sessions/rooms are swept |
| `MAX_TYPING_VELOCITY_CHARS_PER_50MS` | `10` | Anti-cheat threshold |
| `ROOM_MAX_PLAYERS` | `6` | Default max players per room |
| `ROOM_COUNTDOWN_SECONDS` | `3` | Countdown length before a race starts |
| `ROOM_IDLE_TTL_MINUTES` | `20` | Abandoned rooms are reaped after this long |

## REST API

Base URL: `http://localhost:4000` (or your configured `PORT`).

### Auth

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | `{ username, email, password }` |
| POST | `/api/auth/login` | — | `{ email, password }` |
| POST | `/api/auth/google` | — | `{ idToken }` |
| GET | `/api/auth/me` | Bearer | — |

**Register / Login response:**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "username": "speedster99", "email": "...", "bestWpm": 0 }
}
```

### Results

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| POST | `/api/results` | Bearer | `{ wpm, accuracy, errors?, totalTyped, duration? }` |
| GET | `/api/results/me` | Bearer | — |
| GET | `/api/results/leaderboard?limit=10` | — | — |

### Prompts

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| GET | `/api/prompts/random` | — | — |
| GET | `/api/prompts/:id` | — | — |

### Health

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/health` | — |

```json
{
  "status": "OK",
  "environment": "development",
  "database": "connected",
  "activeSoloSessions": 0,
  "activeRooms": 0,
  "timestamp": "2026-08-31T12:00:00.000Z"
}
```

### Example: full curl flow

```bash
# Register (or Login if the account exists)
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"speedster99","email":"speedster99@example.com","password":"hunter2pass"}'

# → copy the "token" from the response, then:
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <token>"

curl -X POST http://localhost:4000/api/results \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"wpm":72.4,"accuracy":96.5,"errors":3,"totalTyped":210,"duration":30}'
```

A ready-to-import **Postman collection + environment** covering every route
above (with the JWT auto-saved after register/login) is available alongside
this project.

## Socket.IO API

### Socket authentication

Every connection must present a JWT — there is no dev-mode bypass:

```js
const socket = io("http://localhost:4000", {
  auth: { token: "<jwt from /api/auth/login or /register>" }
});
```

Connections without a valid, unexpired token are rejected before any event
handler runs.

### Solo sessions

| Direction | Event | Payload |
| --- | --- | --- |
| Client → Server | `start_solo_session` | `{}` (optional) |
| Client → Server | `typing_progress` | `{ typedIndex, correctCharacters }` |
| Server → Client | `session_started` | prompt + session id |
| Server → Client | `stats_update` | live `{ wpm, accuracy, progressPercent }` |
| Server → Client | `session_summary` | final stats on completion |
| Server → Client | `error_event` | `{ code, message, timestamp }` |

### Multiplayer rooms

| Direction | Event | Payload |
| --- | --- | --- |
| Client → Server | `create_room` | `{ maxPlayers? }` |
| Client → Server | `join_room` | `{ code }` |
| Client → Server | `leave_room` | `{}` |
| Client → Server | `toggle_ready` | `{}` |
| Client → Server | `race_progress` | `{ typedIndex, correctCharacters }` |
| Server → Client | `room_state` | full room + player list, broadcast on any change |
| Server → Client | `room_countdown` | `{ roomId, secondsRemaining }` |
| Server → Client | `race_started` | `{ roomId, promptId, textPrompt, characterCount, startTime }` |
| Server → Client | `race_progress_update` | `{ userId, username, wpm, accuracy, progressPercent }` |
| Server → Client | `player_finished` | `{ roomId, userId, username, placement, wpm, accuracy }` |
| Server → Client | `race_summary` | `{ roomId, matchId, results[] }` — sent once the race closes out |
| Server → Client | `error_event` | `{ code, message, timestamp }` |

**Flow:**
1. Connect with a JWT → `create_room` → get a room code back via `room_state`.
2. Other players `join_room({ code })`.
3. Everyone (except the host, who starts ready) sends `toggle_ready`.
4. Once ≥2 players are all ready, the server auto-starts a `room_countdown`,
   then emits `race_started` with one shared prompt for the whole room.
5. Players send `race_progress` periodically; the room gets
   `race_progress_update` broadcasts and `player_finished` as each player
   completes the prompt (with placement).
6. Once everyone finishes (or a grace period after the first finisher
   elapses), the server persists a `Match` document, updates each user's
   `bestWpm` / `matchesPlayed` / `matchesWon`, and emits `race_summary`.

Full type contracts: [`src/models/typing.types.ts`](./src/models/typing.types.ts).

## API docs (Swagger)

- Interactive UI: **`GET /api-docs`**
- Raw OpenAPI 3.0 JSON: **`GET /api-docs.json`**

Covers every REST route with request/response schemas and a `bearerAuth`
scheme — click **Authorize** in the UI, paste a JWT from `/login` or
`/register`, and exercise protected routes directly in the browser.
Socket.IO events aren't representable in OpenAPI, so they're documented
above instead.

## Data models

**User** — `username`, `email`, hashed `password` (local) or `googleId`
(OAuth), `bestWpm`, `matchesPlayed`, `matchesWon`.

**Result** — one solo typing-test attempt: `userId`, `wpm`, `accuracy`,
`errors`, `totalTyped`, `duration`.

**Match** — one finished multiplayer race: `roomCode`, `promptId`,
`textPrompt`, `hostId`, `participants[]` (`userId`, `username`, `wpm`,
`accuracy`, `placement`, `finishedAt`, `disconnected`), `startedAt`,
`finishedAt`.

## Architecture notes

- **Server-authoritative everything.** WPM/accuracy are computed server-side
  from `typedIndex`/`correctCharacters`, not trusted from the client.
- **Anti-cheat.** Both solo and room progress ticks are checked against a
  max characters-per-tick velocity; violations reject the tick with an
  `error_event` rather than silently accepting it.
- **Rooms are in-memory, matches are persisted.** Active room/player state
  lives in a `Map` in `room.service.ts` for low-latency updates; only the
  final result of a completed race is written to MongoDB.
- **One JWT, two transports.** The same token issued by `/api/auth/login`
  authenticates both REST (`Authorization: Bearer`) and Socket.IO
  (`socket.handshake.auth.token`) — no separate socket-auth flow needed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run with `tsx --watch` (auto-restart on file change) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`node dist/index.js`) |
| `npm run typecheck` | `tsc --noEmit` — no build output, just type errors |

## Troubleshooting

- **404 on every route** — the server likely never finished starting
  because `connectDB()` failed. Check your terminal for a MongoDB
  connection error before assuming a route is missing.
- **`Cannot find module 'swagger-ui-express'`** — run `npm install` again;
  `node_modules` wasn't refreshed after pulling this version.
- **Socket connection rejected** — you're either missing
  `auth: { token }` in the client's `io()` call, or the token is expired
  (`JWT_EXPIRES_IN`) or was signed with a different `JWT_SECRET` than the
  one the server currently has loaded.
- **`curl` command fails / hangs** — the multi-line `-d '{...}'` examples
  above are bash syntax; on Windows use WSL, or PowerShell's backtick
  line-continuation with escaped quotes, or just use the Postman collection.
