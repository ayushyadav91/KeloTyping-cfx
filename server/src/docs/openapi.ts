import { env } from '../config/env.config';

/**
 * Hand-authored OpenAPI 3.0 document for every REST route in this service.
 * Socket.IO events (solo sessions + multiplayer rooms) aren't representable
 * in OpenAPI — they're documented in README.md and models/typing.types.ts
 * instead, and summarized in this spec's top-level `description`.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'KeloTyping API',
    version: '1.0.0',
    description:
      'REST + Socket.IO backend for KeloTyping: solo typing-speed sessions and ' +
      'live multiplayer typing races. This document covers the REST surface only. ' +
      'Socket.IO events (`create_room`, `join_room`, `toggle_ready`, `race_progress`, ' +
      '`start_solo_session`, `typing_progress`, etc.) require a JWT passed as ' +
      '`socket.handshake.auth.token` — obtain it from `/api/auth/login` or `/api/auth/register` ' +
      'below, then see README.md for the full event contract.',
  },
  servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local development' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, and Google OAuth' },
    { name: 'Results', description: 'Solo typing-test results and leaderboard' },
    { name: 'Prompts', description: 'Typing prompt text' },
    { name: 'Health', description: 'Service and connection status' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT returned from /api/auth/register, /api/auth/login, or /api/auth/google',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string', example: 'speedster99' },
          email: { type: 'string', format: 'email' },
          avatar: { type: 'string', nullable: true },
          bestWpm: { type: 'number', example: 87 },
          matchesPlayed: { type: 'integer', example: 12 },
          matchesWon: { type: 'integer', example: 4 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', description: 'JWT — use as Bearer token for REST and as socket.handshake.auth.token for Socket.IO' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 20, example: 'speedster99' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6, format: 'password' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      GoogleLoginRequest: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: { type: 'string', description: 'Google Sign-In ID token from the client SDK' },
        },
      },
      Result: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          wpm: { type: 'number', example: 72.4 },
          accuracy: { type: 'number', example: 96.5 },
          errors: { type: 'integer', example: 3 },
          totalTyped: { type: 'integer', example: 210 },
          duration: { type: 'integer', example: 30 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ResultCreateRequest: {
        type: 'object',
        required: ['wpm', 'accuracy', 'totalTyped'],
        properties: {
          wpm: { type: 'number', minimum: 0, example: 72.4 },
          accuracy: { type: 'number', minimum: 0, maximum: 100, example: 96.5 },
          errors: { type: 'integer', minimum: 0, example: 3 },
          totalTyped: { type: 'integer', minimum: 0, example: 210 },
          duration: { type: 'integer', minimum: 1, example: 30 },
        },
      },
      LeaderboardEntry: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          wpm: { type: 'number' },
          accuracy: { type: 'number' },
          date: { type: 'string', format: 'date-time' },
        },
      },
      Prompt: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          content: { type: 'string' },
          characterCount: { type: 'integer' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: { msg: { type: 'string' }, param: { type: 'string' }, location: { type: 'string' } },
            },
          },
        },
      },
      ErrorMessage: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid credentials' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service, database, and live-session status',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    environment: { type: 'string' },
                    database: { type: 'string', enum: ['connected', 'disconnected'] },
                    activeSoloSessions: { type: 'integer' },
                    activeRooms: { type: 'integer' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create a local account',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          '201': { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '400': { description: 'Validation error or account already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email + password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in or sign up with a Google ID token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleLoginRequest' } } },
        },
        responses: {
          '200': { description: 'Logged in / account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Invalid or unverified Google token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the currently authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current user', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' } } } } } },
          '401': { description: 'Missing/invalid token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/api/results': {
      post: {
        tags: ['Results'],
        summary: 'Save a solo typing-test result',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultCreateRequest' } } },
        },
        responses: {
          '201': { description: 'Result saved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, result: { $ref: '#/components/schemas/Result' } } } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          '401': { description: 'Missing/invalid token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/api/results/me': {
      get: {
        tags: ['Results'],
        summary: "Get the authenticated user's result history (most recent 50)",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Result history', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, results: { type: 'array', items: { $ref: '#/components/schemas/Result' } } } } } } },
        },
      },
    },
    '/api/results/leaderboard': {
      get: {
        tags: ['Results'],
        summary: 'Public leaderboard of best solo scores',
        parameters: [
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
        ],
        responses: {
          '200': { description: 'Leaderboard', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, leaderboard: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } } } } } } },
        },
      },
    },
    '/api/prompts/random': {
      get: {
        tags: ['Prompts'],
        summary: 'Get a random typing prompt',
        responses: {
          '200': { description: 'A prompt', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Prompt' } } } } } },
        },
      },
    },
    '/api/prompts/{id}': {
      get: {
        tags: ['Prompts'],
        summary: 'Get a specific prompt by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'A prompt', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Prompt' } } } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, error: { type: 'string' } } } } } },
        },
      },
    },
  },
} as const;
