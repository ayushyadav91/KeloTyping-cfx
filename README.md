# Kelo Typing Platform - Backend Engine

An enterprise-grade, high-performance real-time typing platform backend built with **TypeScript**, **Node.js**, **Express**, and **Socket.IO**. Designed for high throughput, sub-millisecond telemetry calculation, robust anti-cheat velocity verification, and real-time state management.

---

## Technical Overview

The Kelo Typing Engine provides a real-time WebSocket connection layer and HTTP REST API for single-player practice and multi-user typing sessions. The platform streams progress updates over WebSockets, computes typing metrics (Words Per Minute, Words Per Second, Accuracy %, and Completion %), and enforces strict anti-cheat rules against macro/bot automation attacks.

### Key Architecture Features

- **Real-Time Telemetry Processing:** Sub-millisecond calculation of WPM (using the standardized 5-character word standard), WPS, accuracy, and overall session progress percentage.
- **Anti-Cheat Velocity Enforcement:** Detects automated keystroke injection attacks by evaluating character count deltas and instantaneous typing velocity thresholds (`charDelta > 8` in `< 200ms` or instant WPM `> 250`).
- **Memory-Safe TTL Garbage Collection:** Inactive or abandoned practice sessions are automatically groomed by an active background garbage collection process based on configurable TTL parameters.
- **Socket & HTTP Rate Limiting:** Built-in sliding-window rate limiters shield WebSocket handlers and HTTP endpoints from denial-of-service attempts.
- **Strict Contract & Type Safety:** Fully typed Socket.IO contracts (`ClientToServerEvents`, `ServerToClientEvents`, `InterServerEvents`, `SocketData`) and Zod schema validation for incoming payloads.
- **Production-Grade Resilience:** Structured JSON logging via Winston, centralized HTTP & WebSocket error handling, graceful shutdown handlers (`SIGTERM`, `SIGINT`), and memory-capped payload limits (`maxHttpBufferSize: 1MB`).

---

## Folder Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.config.ts    # Database connection configuration
│   │   └── env.config.ts         # Zod environment variable validation
│   ├── controllers/
│   │   ├── auth.controller.ts    # Authentication request handlers
│   │   ├── prompts.controller.ts # REST handlers for text prompts
│   │   ├── typing.service.ts     # Core typing session state & anti-cheat engine
│   │   └── typing.socket.ts      # Socket.IO connection manager & event handlers
│   ├── middlewares/
│   │   ├── authMiddleware.ts     # Authentication middleware
│   │   └── rateLimiter.ts        # HTTP & Socket rate limiting rules
│   ├── models/
│   │   ├── prompt.model.ts       # Text prompt data access & seed dataset
│   │   ├── typing.schema.ts      # Zod validation schemas for payload verification
│   │   ├── typing.types.ts       # Socket.IO contract interfaces & telemetry types
│   │   └── user.model.ts         # User schema & data model definitions
│   ├── routes/
│   │   ├── auth.route.ts         # Router for auth endpoints
│   │   └── prompts.routes.ts     # Router for text prompt queries
│   ├── utils/
│   │   ├── asyncHandler.ts       # Controller exception wrapper
│   │   ├── errorResponse.ts      # Standardized API error handler & formatters
│   │   ├── logger.ts             # Structured Winston JSON logging provider
│   │   └── wpmCalculator.ts      # Metric math (WPM, WPS, Accuracy, Progress)
│   ├── app.ts                    # Express app configuration & middleware pipeline
│   └── index.ts                  # Server entry point, HTTP & Socket.IO bootstrapper
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## API & Protocol Specification

### HTTP REST Endpoints

| Method | Endpoint | Description | Response Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server health check and active sessions counter | `{ status: 'OK', environment: string, activeSessions: number, timestamp: string }` |
| `GET` | `/api/prompts/random` | Fetches a random typing prompt | `{ success: true, data: TextPrompt }` |
| `GET` | `/api/prompts/:id` | Fetches a specific text prompt by ID | `{ success: true, data: TextPrompt }` |

### WebSocket Event Contracts

#### Client to Server (`ClientToServerEvents`)

- **`start_solo_session`**: Request to initialize a practice session.
  ```json
  {
    "promptId": "prompt_001"
  }
  ```
- **`typing_progress`**: Emitted periodically as the user types text.
  ```json
  {
    "sessionId": "solo_sess_1786536960010_eim31k1",
    "typedIndex": 42,
    "correctCharacters": 40
  }
  ```

#### Server to Client (`ServerToClientEvents`)

- **`session_started`**: Emitted upon successful session initialization.
  ```json
  {
    "sessionId": "solo_sess_1786536960010_eim31k1",
    "textPrompt": "Simplicity is prerequisite for reliability...",
    "characterCount": 130,
    "startTime": 1786536960010
  }
  ```
- **`stats_update`**: Real-time performance telemetry emitted after every valid progress update.
  ```json
  {
    "sessionId": "solo_sess_1786536960010_eim31k1",
    "typedIndex": 42,
    "correctCharacters": 40,
    "wpm": 84.5,
    "wps": 1.41,
    "accuracy": 95.24,
    "progressPercent": 32.3,
    "elapsedTimeMs": 5680,
    "isCompleted": false
  }
  ```
- **`session_summary`**: Emitted when `progressPercent` reaches 100%.
  ```json
  {
    "sessionId": "solo_sess_1786536960010_eim31k1",
    "finalWpm": 88.2,
    "finalWps": 1.47,
    "finalAccuracy": 97.5,
    "totalTimeMs": 14200,
    "completedAt": 1786536974210
  }
  ```
- **`error_event`**: Emitted when rate limits, validation errors, or anti-cheat violations occur.
  ```json
  {
    "code": "ANTI_CHEAT_VIOLATION",
    "message": "Unnatural typing velocity detected. Session progress rejected.",
    "timestamp": 1786536960500
  }
  ```

---

## Environment Configuration

The engine uses **Zod** to validate environment variables at startup. Create a `.env` file in the root directory:

```ini
# Server Environment Setup
NODE_ENV=development
PORT=4000
CORS_ORIGIN=*

# Authentication & Session Limits
MOCK_AUTH_TOKEN=mock_token_xyz
SESSION_TTL_MINUTES=15
CLEANUP_INTERVAL_MINUTES=5

# Security & Anti-Cheat Velocity Thresholds
MAX_TYPING_VELOCITY_CHARS_PER_50MS=10
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server with live reload:

```bash
npm run dev
```

The server will start listening on `http://localhost:4000`.

### Production Build & Deployment

1. Compile TypeScript to JavaScript:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

---

## Testing & Quality Assurance

### Type Checking

Verify full static type safety across the entire codebase:

```bash
npx tsc --noEmit
```

### Integration & Verification Testing

Run the automated Socket.IO integration test runner:

```bash
npx tsx src/testSocketClient.ts
```

Run the end-to-end CLI simulation test (verifies human typist execution and bot attack anti-cheat interception):

```bash
npx tsx src/scratch/cliTypingClient.ts
```

---

## Quality & Security Standards

- **Strict Type Checking:** No implicit `any` types; all Socket handlers and domain models use explicit interfaces.
- **Sanitized Logging:** Emojis and decorative ASCII banners are omitted in favor of structured Winston JSON logs formatted for log aggregation services (Datadog, CloudWatch, ELK).
- **Graceful Resource Release:** All timers (`setInterval` / `setTimeout`) are properly cleared and `unref`'d during shutdown sequences to prevent process hangs or memory leaks.

---

## License

ISC License. Copyright (c) CyberForenX & Associates. All rights reserved.
