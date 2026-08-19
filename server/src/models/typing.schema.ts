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
