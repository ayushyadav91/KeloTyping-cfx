import { IUser } from "../models/User";

// Augment Express's Request type so `req.user` is typed everywhere
// once the `protect` middleware has run.
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
