// Single-use, time-limited tokens for email verification and password reset.
// The raw token goes in the emailed link; only its sha256 hash is stored.
// Consumption is atomic (UPDATE ... WHERE not-consumed AND not-expired
// RETURNING), so a token can be redeemed at most once.

import { randomBytes, createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDb } from './db.js';
import { emailVerificationTokens, passwordResetTokens } from './schema.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

export function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  await getDb()
    .insert(emailVerificationTokens)
    .values({
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });
  return raw;
}

// Returns the userId if the token was valid and is now consumed, else null.
export async function consumeEmailVerificationToken(raw: string): Promise<string | null> {
  const rows = await getDb()
    .update(emailVerificationTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, hashToken(raw)),
        isNull(emailVerificationTokens.consumedAt),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: emailVerificationTokens.userId });
  return rows[0]?.userId ?? null;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  await getDb()
    .insert(passwordResetTokens)
    .values({
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });
  return raw;
}

export async function consumePasswordResetToken(raw: string): Promise<string | null> {
  const rows = await getDb()
    .update(passwordResetTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(raw)),
        isNull(passwordResetTokens.consumedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: passwordResetTokens.userId });
  return rows[0]?.userId ?? null;
}
