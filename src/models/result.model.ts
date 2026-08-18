import mongoose, { Document, Model, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IResult extends Omit<Document<string>, "errors"> {
  _id: string; // UUID
  userId: string; // UUID, references users(id)
  wpm: number;
  accuracy: number;
  errors: number;
  totalTyped: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    wpm: { type: Number, required: true, min: 0 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    errors: { type: Number, default: 0, min: 0 },
    totalTyped: { type: Number, required: true, min: 0 },
    duration: { type: Number, default: 30 },
  },
  { timestamps: true, _id: false, suppressReservedKeysWarning: true }
);

ResultSchema.index({ userId: 1, createdAt: -1 });
ResultSchema.index({ wpm: -1 });

const Result: Model<IResult> = mongoose.model<IResult>("Result", ResultSchema);
export default Result;
