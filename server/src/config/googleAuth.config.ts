import { OAuth2Client } from "google-auth-library";
import { env } from "./env.config";

let client: OAuth2Client | null = null;

const getClient = (): OAuth2Client => {
  if (!client) {
    if (!env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not set in the environment");
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return client;
};

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar?: string | undefined;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleProfile> => {
  if (!env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not set in the environment");

  const oauthClient = getClient();
  const ticket = await oauthClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();

  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google token payload");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    name: payload.name || payload.email.split("@")[0] || "user",
    avatar: payload.picture,
  };
};
