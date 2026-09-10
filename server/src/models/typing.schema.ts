import { z } from 'zod';

export const StartSoloSessionSchema = z.object({
  promptId: z.string().optional(),
}).optional();

export const TypingProgressSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  typedIndex: z.number().int().min(0, 'typedIndex must be non-negative'),
  correctCharacters: z.number().int().min(0, 'correctCharacters must be non-negative'),
});

export const StatsUpdateSchema = z.object({
  sessionId: z.string(),
  typedIndex: z.number(),
  correctCharacters: z.number(),
  wpm: z.number(),
  wps: z.number(),
  accuracy: z.number(),
  progressPercent: z.number(),
  elapsedTimeMs: z.number(),
  isCompleted: z.boolean(),
});

export type ValidatedStartSoloSession = z.infer<typeof StartSoloSessionSchema>;
export type ValidatedTypingProgress = z.infer<typeof TypingProgressSchema>;
export type ValidatedStatsUpdate = z.infer<typeof StatsUpdateSchema>;

// ---------------------------------------------------------------------------
// Multiplayer rooms
// ---------------------------------------------------------------------------

export const CreateRoomSchema = z
  .object({
    maxPlayers: z.number().int().min(2).max(12).optional(),
  })
  .optional();

export const JoinRoomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, 'Room code is required')
    .max(12, 'Room code is invalid'),
});

export const RaceProgressSchema = z.object({
  typedIndex: z.number().int().min(0, 'typedIndex must be non-negative'),
  correctCharacters: z.number().int().min(0, 'correctCharacters must be non-negative'),
});

export type ValidatedCreateRoom = z.infer<typeof CreateRoomSchema>;
export type ValidatedJoinRoom = z.infer<typeof JoinRoomSchema>;
export type ValidatedRaceProgress = z.infer<typeof RaceProgressSchema>;
