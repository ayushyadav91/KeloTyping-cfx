import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export type AuthProvider = "local" | "google";

export interface IUser extends Document<string> {
  _id: string; // UUID, not ObjectId
  username: string;
  email: string;
  password?: string;
  authProvider: AuthProvider;
  googleId?: string;
  avatar?: string;
  bestWpm: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    _id: {
      type: String,
      default: () => uuidv4(), // id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    bestWpm: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, _id: false } // _id defined manually above (UUID string, not ObjectId)
);

UserSchema.pre("validate", function (next) {
  if (this.authProvider === "local" && !this.password) {
    this.invalidate("password", "Password is required for local accounts");
  }
  next();
});

UserSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
