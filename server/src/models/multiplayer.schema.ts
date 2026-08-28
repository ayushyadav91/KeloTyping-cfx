import { z } from 'zod';

export const RoomCodeSchema = z
  .string({
    message: 'roomCode is required',
  })
  .trim()
  .toUpperCase()
  .min(4, 'roomCode must be at least 4 characters');

export const CreateRoomSchema = z
  .object({
    maxCapacity: z
      .number()
      .int()
      .min(2, 'Minimum room capacity is 2')
      .max(10, 'Maximum room capacity is 10')
      .optional()
      .default(5),
    promptId: z.string().trim().optional(),
  })
  .optional();

export const JoinRoomRequestSchema = z.object({
  roomCode: RoomCodeSchema,
  token: z.string().trim().optional(),
});

export const ApproveJoinRequestSchema = z.object({
  roomCode: RoomCodeSchema,
  requesterUserId: z.string().min(1, 'requesterUserId is required'),
});

export const RejectJoinRequestSchema = z.object({
  roomCode: RoomCodeSchema,
  requesterUserId: z.string().min(1, 'requesterUserId is required'),
  reason: z.string().trim().max(200, 'Reason cannot exceed 200 characters').optional(),
});

export const ToggleReadySchema = z.object({
  roomCode: RoomCodeSchema,
  isReady: z.boolean(),
});

export const StartRaceCountdownSchema = z.object({
  roomCode: RoomCodeSchema,
});

export const MultiplayerTypingProgressSchema = z.object({
  roomCode: RoomCodeSchema,
  typedIndex: z.number().int().min(0, 'typedIndex must be a non-negative integer'),
  correctCharacters: z.number().int().min(0, 'correctCharacters must be a non-negative integer'),
});

export const LeaveRoomSchema = z.object({
  roomCode: RoomCodeSchema,
});
