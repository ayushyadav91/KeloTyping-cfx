import crypto from 'crypto';
import { env } from '../config/env.config';
import { InvalidInviteTokenError, ExpiredInviteTokenError } from './errorResponse';

// Non-ambiguous uppercase alphanumeric character set (excludes 0, O, I, 1, L)
const UNAMBIGUOUS_CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export interface InviteTokenPayload {
  roomCode: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Generates a cryptographically secure, collision-resistant room code.
 * Format: RACE-XXXXXX (e.g. RACE-7K9P2M)
 */
export function generateRoomCode(): string {
  const codeLength = 6;
  const bytes = crypto.randomBytes(codeLength);
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    const byteVal = bytes[i] ?? 0;
    const index = byteVal % UNAMBIGUOUS_CHARACTERS.length;
    code += UNAMBIGUOUS_CHARACTERS.charAt(index);
  }
  return `RACE-${code}`;
}

/**
 * Generates an HMAC-SHA256 signed token for a room invite link.
 */
export function generateInviteToken(
  roomCode: string,
  ttlMinutes: number = env.SESSION_TTL_MINUTES
): string {
  const now = Date.now();
  const expiresAt = now + ttlMinutes * 60 * 1000;

  const payload: InviteTokenPayload = {
    roomCode,
    createdAt: now,
    expiresAt,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', env.INVITE_LINK_SECRET);
  hmac.update(`${roomCode}.${payloadB64}`);
  const signatureB64 = hmac.digest('base64url');

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Constructs a full signed invite URL.
 */
export function generateInviteLink(
  roomCode: string,
  ttlMinutes: number = env.SESSION_TTL_MINUTES
): { inviteLink: string; inviteToken: string } {
  const token = generateInviteToken(roomCode, ttlMinutes);
  const baseUrl = env.CLIENT_APP_URL.replace(/\/+$/, '');
  const inviteLink = `${baseUrl}/race/${roomCode}?token=${token}`;
  return { inviteLink, inviteToken: token };
}

/**
 * Verifies an invite token against roomCode, cryptographic signature, and expiration timestamp.
 */
export function verifyInviteToken(roomCode: string, token: string): InviteTokenPayload {
  if (!token || typeof token !== 'string') {
    throw new InvalidInviteTokenError('Invite link token is required.');
  }

  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new InvalidInviteTokenError('Malformed invite token format.');
  }

  const payloadB64 = parts[0];
  const signatureB64 = parts[1];

  // Re-compute HMAC signature
  const hmac = crypto.createHmac('sha256', env.INVITE_LINK_SECRET);
  hmac.update(`${roomCode}.${payloadB64}`);
  const expectedSignatureB64 = hmac.digest('base64url');

  // Constant-time signature comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signatureB64, 'utf-8');
  const expectedBuffer = Buffer.from(expectedSignatureB64, 'utf-8');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new InvalidInviteTokenError('Invite token signature verification failed.');
  }

  // Parse payload
  let payload: InviteTokenPayload;
  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    payload = JSON.parse(jsonStr);
  } catch (_err) {
    throw new InvalidInviteTokenError('Invalid payload in invite token.');
  }

  if (payload.roomCode !== roomCode) {
    throw new InvalidInviteTokenError('Invite token does not match the requested room code.');
  }

  if (Date.now() > payload.expiresAt) {
    throw new ExpiredInviteTokenError('Invite link token has expired.');
  }

  return payload;
}
