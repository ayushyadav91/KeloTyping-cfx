import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IResult extends Omit<Document, "errors"> {
  user: Types.ObjectId;
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
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wpm: {
      type: Number,
      required: true,
      min: 0,
    },
    accuracy: {
      type: Number, // percentage 0-100
      required: true,
      min: 0,
      max: 100,
    },
    errors: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTyped: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number, // seconds
      default: 30,
    },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

ResultSchema.index({ user: 1, createdAt: -1 });
ResultSchema.index({ wpm: -1 });

const Result: Model<IResult> = mongoose.model<IResult>("Result", ResultSchema);

export default Result;
