# KeloTyping — Backend

Real-time typing-speed backend: solo practice sessions **and** live multiplayer
typing races, over Socket.IO, with JWT + Google OAuth authentication and
MongoDB persistence.

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

This service provides a full-featured real-time typing platform:

- Solo practice sessions with server-authoritative telemetry and anti-cheat velocity checks.
- Real-time multiplayer typing races over Socket.IO (create/join room, countdown, live progress broadcasts, match history).
- JWT + Google OAuth authentication with MongoDB persistence.

## Features

- 🔐 JWT auth (register/login) + Google OAuth ID-token login
- 🗄️ MongoDB persistence via Mongoose (`User`, `Result`, `Match`)
- ⌨️ Solo typing sessions — server-computed WPM/accuracy, per-tick anti-cheat
- 🏁 Multiplayer rooms — create/join by code, ready-up, synced countdown, live race broadcasts, placements, persisted results
- 📊 Public leaderboard (solo best scores)
- 📖 Interactive Swagger/OpenAPI docs for the whole REST surface
- 🛡️ Helmet, CORS, rate limiting (global + auth-specific), structured Winston logging
- ✅ Fully typed end-to-end (TypeScript)

## Project structure

```
.
├── server/
│   ├── src/
│   │   ├── app.ts                    # Express app: middleware, routes, Swagger
│   │   ├── index.ts                  # Entry point: connects DB, boots HTTP + Socket.IO
│   │   ├── config/
│   │   │   ├── env.config.ts         # zod-validated environment schema
│   │   │   ├── database.config.ts    # Mongoose connection
│   │   │   └── googleAuth.config.ts  # Google ID-token verification
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts    # register / login / google / me
│   │   │   ├── result.controller.ts  # save result / history / leaderboard
│   │   │   ├── typing.service.ts     # solo session engine
│   │   │   ├── typing.socket.ts      # solo session socket handlers
│   │   │   ├── room.service.ts       # multiplayer room/player state machine
│   │   │   └── room.socket.ts        # multiplayer socket handlers
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.ts     # REST `protect` + Socket.IO auth middleware
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── rateLimiter.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── result.model.ts
│   │   │   ├── match.model.ts        # persisted multiplayer race results
│   │   │   ├── prompt.model.ts       # in-memory prompt bank
│   │   │   ├── typing.types.ts       # Socket.IO event contracts (client<->server)
│   │   │   └── typing.schema.ts      # zod validation for socket payloads
│   │   ├── routes/
│   │   │   ├── auth.route.ts
│   │   │   ├── result.route.ts
│   │   │   └── prompts.routes.ts
│   │   ├── docs/
│   │   │   └── openapi.ts            # hand-written OpenAPI 3.0 spec
│   │   ├── utils/
│   │   │   ├── generateToken.ts
│   │   │   ├── asyncHandler.ts
│   │   │   ├── errorResponse.ts      # AppError / SocketError / RoomError hierarchy
│   │   │   ├── wpmCalculator.ts
│   │   │   └── logger.ts             # Winston
│   │   └── types/
│   │       └── express.d.ts          # Request.user augmentation
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── src/                              # React + Vite Frontend
├── package.json
└── README.md
```

## Getting started

**Requirements:** Node.js ≥18, a reachable MongoDB instance (local or Atlas).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Run in dev mode
npm run dev
```

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

## Socket.IO API

### Socket authentication

Every connection must present a JWT:

```js
const socket = io("http://localhost:4000", {
  auth: { token: "<jwt from /api/auth/login or /register>" }
});
```

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

## API docs (Swagger)

- Interactive UI: **`GET /api-docs`**
- Raw OpenAPI 3.0 JSON: **`GET /api-docs.json`**

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run with `tsx --watch` (auto-restart on file change) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`node dist/index.js`) |
| `npm run typecheck` | `tsc --noEmit` — no build output, just type errors |

## License

ISC License. Copyright (c) CyberForenX & Associates. All rights reserved.
