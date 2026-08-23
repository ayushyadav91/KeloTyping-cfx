// OpenAPI 3.0 specification, defined as a plain object rather than a separate
// YAML/JSON file so it compiles straight through tsc with no extra copy step.
export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "KeloTyping API",
    version: "1.0.0",
    description:
      "Authentication (local + Google OAuth) and solo typing-result tracking for the KeloTyping backend.",
  },
  servers: [{ url: "/api", description: "Base API path" }],
  tags: [
    { name: "Auth", description: "Registration, login, Google OAuth, current user" },
    { name: "Results", description: "Solo typing test results and leaderboard" },
    { name: "Health", description: "Service status" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string", example: "alice" },
          email: { type: "string", format: "email", example: "alice@example.com" },
          avatar: { type: "string", nullable: true },
          bestWpm: { type: "number", example: 0 },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 20, example: "alice" },
          email: { type: "string", format: "email", example: "alice@example.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "alice@example.com" },
          password: { type: "string", example: "secret123" },
        },
      },
      GoogleLoginRequest: {
        type: "object",
        required: ["idToken"],
        properties: {
          idToken: { type: "string", description: "Google ID token from the frontend Sign-In SDK" },
        },
      },
      MeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          user: {
            allOf: [
              { $ref: "#/components/schemas/User" },
              {
                type: "object",
                properties: { createdAt: { type: "string", format: "date-time" } },
              },
            ],
          },
        },
      },
      Result: {
        type: "object",
        properties: {
          _id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          wpm: { type: "number", example: 85 },
          accuracy: { type: "number", example: 97.5 },
          errors: { type: "number", example: 3 },
          totalTyped: { type: "number", example: 420 },
          duration: { type: "number", example: 30 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateResultRequest: {
        type: "object",
        required: ["wpm", "accuracy", "totalTyped"],
        properties: {
          wpm: { type: "number", minimum: 0, example: 85 },
          accuracy: { type: "number", minimum: 0, maximum: 100, example: 97.5 },
          errors: { type: "number", minimum: 0, example: 3 },
          totalTyped: { type: "number", minimum: 0, example: 420 },
          duration: { type: "number", minimum: 1, example: 30 },
        },
      },
      LeaderboardEntry: {
        type: "object",
        properties: {
          username: { type: "string", example: "alice" },
          wpm: { type: "number", example: 85 },
          accuracy: { type: "number", example: 97.5 },
          date: { type: "string", format: "date-time" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid credentials" },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", example: "field" },
                msg: { type: "string", example: "Password must be at least 6 characters" },
                path: { type: "string", example: "password" },
                location: { type: "string", example: "body" },
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request body failed validation",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationErrorResponse" } } },
      },
      Unauthorized: {
        description: "Missing, invalid, or expired token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "API is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          "201": {
            description: "Account created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          "200": {
            description: "Authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Sign in or sign up with a Google ID token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/GoogleLoginRequest" } } },
        },
        responses: {
          "200": {
            description: "Authenticated (existing or newly linked/created account)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current authenticated user's profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MeResponse" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/results": {
      post: {
        tags: ["Results"],
        summary: "Save a completed typing test result",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateResultRequest" } } },
        },
        responses: {
          "201": {
            description: "Result saved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    result: { $ref: "#/components/schemas/Result" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/results/me": {
      get: {
        tags: ["Results"],
        summary: "Get the current user's own result history",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Result history (most recent first, max 50)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "number", example: 1 },
                    results: { type: "array", items: { $ref: "#/components/schemas/Result" } },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/results/leaderboard": {
      get: {
        tags: ["Results"],
        summary: "Get the public leaderboard",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
            description: "Max number of entries to return",
          },
        ],
        responses: {
          "200": {
            description: "Top scores across all users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "number", example: 10 },
                    leaderboard: { type: "array", items: { $ref: "#/components/schemas/LeaderboardEntry" } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
