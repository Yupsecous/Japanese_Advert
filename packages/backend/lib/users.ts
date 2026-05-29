// User records, argon2id password hashing, and the Google account-linking
// decision logic. Emails are always normalized to lower-case; the DB unique
// constraint enforces one account per address.

import { hash, verify } from '@node-rs/argon2';
import { and, eq } from 'drizzle-orm';
import { getDb } from './db.js';
import { users, oauthAccounts, type User } from './schema.js';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Safe shape returned to the client — never includes password_hash.
export type PublicUser = {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
};

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    emailVerified: u.emailVerifiedAt !== null,
  };
}

export async function hashPassword(password: string): Promise<string> {
  // @node-rs/argon2 defaults to Argon2id with OWASP-aligned cost params.
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return rows[0];
}

export async function findUserById(id: string): Promise<User | undefined> {
  const rows = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

// Creates an unverified email/password user. Throws on a duplicate email
// (pg unique-violation 23505) — callers convert that to a generic response.
export async function createEmailUser(args: {
  email: string;
  passwordHash: string;
  displayName?: string | null;
}): Promise<User> {
  const rows = await getDb()
    .insert(users)
    .values({
      email: normalizeEmail(args.email),
      passwordHash: args.passwordHash,
      displayName: args.displayName ?? null,
      emailVerifiedAt: null,
    })
    .returning();
  return rows[0]!;
}

export async function setUserPassword(userId: string, passwordHash: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function markEmailVerified(userId: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export type GoogleLinkResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'link-requires-login' };

// Implements the account-linking decision table. Google `sub` is identity;
// email is a linking hint trusted only when Google reports it verified.
export async function upsertGoogleUser(args: {
  googleSub: string;
  email: string;
  emailVerified: boolean;
  displayName?: string | null;
}): Promise<GoogleLinkResult> {
  const db = getDb();
  const email = normalizeEmail(args.email);

  return db.transaction(async (tx): Promise<GoogleLinkResult> => {
    // 1. Existing oauth link for this Google account → log in as that user.
    const linked = await tx
      .select({ user: users })
      .from(oauthAccounts)
      .innerJoin(users, eq(users.id, oauthAccounts.userId))
      .where(
        and(
          eq(oauthAccounts.provider, 'google'),
          eq(oauthAccounts.providerUserId, args.googleSub),
        ),
      )
      .limit(1);
    if (linked[0]) return { ok: true, user: linked[0].user };

    // Look up an existing account by email.
    const existingRows = await tx.select().from(users).where(eq(users.email, email)).limit(1);
    const existing = existingRows[0];

    if (!existing) {
      // 2. Brand-new user. Verified at creation iff Google says so.
      const created = await tx
        .insert(users)
        .values({
          email,
          passwordHash: null,
          displayName: args.displayName ?? null,
          emailVerifiedAt: args.emailVerified ? new Date() : null,
        })
        .returning();
      const user = created[0]!;
      await tx.insert(oauthAccounts).values({
        userId: user.id,
        provider: 'google',
        providerUserId: args.googleSub,
        emailAtProvider: email,
      });
      return { ok: true, user };
    }

    // 3/5. Email account exists and Google verified the address → auto-link.
    if (args.emailVerified) {
      await tx.insert(oauthAccounts).values({
        userId: existing.id,
        provider: 'google',
        providerUserId: args.googleSub,
        emailAtProvider: email,
      });
      if (!existing.emailVerifiedAt) {
        await tx
          .update(users)
          .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, existing.id));
      }
      return { ok: true, user: existing };
    }

    // 4. Email account exists but Google did NOT verify → refuse to link
    // (takeover risk); make the user sign in with their password first.
    return { ok: false, reason: 'link-requires-login' };
  });
}
