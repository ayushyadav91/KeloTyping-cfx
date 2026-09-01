import mongoose, { Document, Model, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IMatchParticipant {
  userId: string; // UUID, references users(_id)
  username: string;
  wpm: number;
  accuracy: number;
  progressPercent: number;
  placement: number | null; // 1-based finish order, null if never finished
  finishedAt: Date | null;
  disconnected: boolean;
}

export interface IMatch extends Omit<Document<string>, 'errors'> {
  _id: string; // UUID
  roomCode: string;
  promptId: string;
  textPrompt: string;
  hostId: string;
  participants: IMatchParticipant[];
  startedAt: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MatchParticipantSchema = new Schema<IMatchParticipant>(
  {
    userId: { type: String, ref: 'User', required: true },
    username: { type: String, required: true },
    wpm: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 100, min: 0, max: 100 },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    placement: { type: Number, default: null },
    finishedAt: { type: Date, default: null },
    disconnected: { type: Boolean, default: false },
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatch>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    roomCode: { type: String, required: true, index: true },
    promptId: { type: String, required: true },
    textPrompt: { type: String, required: true },
    hostId: { type: String, ref: 'User', required: true },
    participants: { type: [MatchParticipantSchema], default: [] },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date },
  },
  { timestamps: true, _id: false, suppressReservedKeysWarning: true }
);

MatchSchema.index({ 'participants.userId': 1, createdAt: -1 });
MatchSchema.index({ createdAt: -1 });

const Match: Model<IMatch> = mongoose.model<IMatch>('Match', MatchSchema);
export default Match;
