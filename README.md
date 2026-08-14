# KeloTyping — Backend (Authentication + Database)

Node.js + Express 5 + MongoDB (Mongoose) backend, written in TypeScript, with JWT authentication and typing-result tracking.

## Stack
- TypeScript, run with `tsx` in dev / compiled with `tsc` for prod
- Express 5
- MongoDB via Mongoose 8
- JWT auth (jsonwebtoken + bcryptjs for password hashing)
- express-validator for input validation
- helmet, cors, express-rate-limit for basic hardening
- morgan for request logging

## Setup

```bash
cd server
npm install
cp .env.example .env   # then edit MONGO_URI / JWT_SECRET
npm run dev             # tsx watch, http://localhost:3000
```

Production:
```bash
npm run build   # compiles src/ -> dist/
npm start        # runs dist/index.js
```

You need a running MongoDB instance — either local (`mongodb://127.0.0.1:27017/kelotyping`) or a MongoDB Atlas connection string.

## Environment variables (`.env`)

| Variable       | Description                                  |
|----------------|-----------------------------------------------|
| PORT           | Port the API listens on (default 3000)       |
| NODE_ENV       | development / production / test              |
| MONGO_URI      | MongoDB connection string                     |
| JWT_SECRET     | Secret used to sign JWTs — use a long random value |
| JWT_EXPIRES_IN | Token lifetime, e.g. `7d`                     |
| CLIENT_URL     | Frontend origin allowed by CORS               |

## API Endpoints

### Auth — `/api/auth`
| Method | Route     | Access  | Description                       |
|--------|-----------|---------|------------------------------------|
| POST   | /register | Public  | Create an account, returns JWT    |
| POST   | /login    | Public  | Log in, returns JWT               |
| GET    | /me       | Private | Get the logged-in user's profile  |

**Register / Login body:**
```json
{ "username": "alice", "email": "alice@example.com", "password": "secret123" }
```
**Response:**
```json
{ "success": true, "token": "<jwt>", "user": { "id": "...", "username": "alice", "email": "alice@example.com", "bestWpm": 0 } }
```

### Results — `/api/results`
| Method | Route        | Access  | Description                          |
|--------|--------------|---------|----------------------------------------|
| POST   | /            | Private | Save a typing test result             |
| GET    | /me          | Private | Get the logged-in user's own results  |
| GET    | /leaderboard | Public  | Top scores across all users           |

**Create result body:**
```json
{ "wpm": 85, "accuracy": 97.5, "errors": 3, "totalTyped": 420, "duration": 30 }
```

For private routes, send the JWT as:
```
Authorization: Bearer <token>
```

### Health check
`GET /api/health` → `{ "success": true, "message": "API is running" }`

## Auth flow
1. `POST /api/auth/register` or `/login` → returns a signed JWT (7-day expiry by default).
2. Frontend stores the token and sends it as `Authorization: Bearer <token>` on subsequent requests.
3. The `protect` middleware (`src/middleware/auth.ts`) verifies the token on every private route and attaches the user to `req.user` (typed via `src/types/express.d.ts`).

## Project structure
```
server/
├── src/
│   ├── app.ts                  # Express app, middleware, route mounting
│   ├── index.ts                 # Entry point — connects to Mongo, starts the server
│   ├── config/
│   │   └── db.ts                  # Mongoose connection
│   ├── models/
│   │   ├── User.ts                 # username/email/password (hashed), bestWpm
│   │   └── Result.ts                # wpm/accuracy/errors/totalTyped per user
│   ├── controllers/
│   │   ├── authController.ts        # register / login / getMe
│   │   └── resultController.ts       # createResult / getMyResults / getLeaderboard
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   └── resultRoutes.ts
│   ├── middleware/
│   │   ├── auth.ts                   # JWT protect middleware
│   │   └── errorHandler.ts            # centralized error handling
│   ├── utils/
│   │   ├── generateToken.ts
│   │   └── asyncHandler.ts
│   └── types/
│       └── express.d.ts               # augments Express's Request with req.user
├── tsconfig.json
├── package.json
└── .env.example
```

## Notes on the TypeScript conversion
- `src/index.tsx` was replaced with `src/index.ts` (there's no JSX in a backend-only server) and `tsconfig.json`'s `"jsx": "react-jsx"` was removed accordingly.
- `tsconfig.json` now sets `"types": ["node"]` and `"lib": ["esnext"]` so Node globals (`process`, etc.) type-check.
- `req.user` is typed via a global `Express.Request` augmentation (`src/types/express.d.ts`) instead of `any`.
- Full project builds clean with `tsc --noEmit` under `strict` mode (including `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`, which were already on in your `tsconfig.json`).
