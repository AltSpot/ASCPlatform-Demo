/**
 * Authentication and session handling.
 *
 * Server-only. Sessions are opaque random tokens stored in the database
 * and carried in an httpOnly, SameSite=Lax cookie — the shape a real
 * deployment would keep. Passwords are hashed with scrypt even in demo
 * mode, so nothing here has to change when demo mode is switched off.
 *
 * The ONLY demo-specific behaviour lives in `authenticate`: any password
 * is accepted, and an unknown email mints a new investor. That is the
 * single line to delete when real credentials arrive.
 */
import 'server-only';

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';

import { prisma } from './db';
import { DEMO_MODE, SESSION_COOKIE, SESSION_TTL_DAYS } from './config';
import { DAY_MS, type SessionUser } from './domain';
import { nameFromEmail } from './format';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;

  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
  const expected = Buffer.from(hashHex, 'hex');
  if (derived.length !== expected.length) return false;

  return timingSafeEqual(derived, expected);
}

// ---------------- sessions ----------------

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Current investor, or null. Expired sessions are swept on read. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'UnauthorizedError';
  }
}

/** Session or throw — the guard every mutating route handler uses. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

// ---------------- credential check ----------------

/**
 * Resolve an email + password to a user.
 *
 * DEMO MODE: any password is accepted, and an unknown email creates the
 * investor on the spot. This is the intended behaviour for walkthroughs —
 * whoever is being shown the product should never be stopped by a login.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<{ user: SessionUser; created: boolean }> {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });

  if (existing) {
    if (!DEMO_MODE) {
      const ok = await verifyPassword(password, existing.passwordHash);
      if (!ok) throw new UnauthorizedError();
    }
    return {
      user: { id: existing.id, email: existing.email, name: existing.name },
      created: false,
    };
  }

  if (!DEMO_MODE) throw new UnauthorizedError();

  const created = await prisma.user.create({
    data: {
      email: normalized,
      name: nameFromEmail(normalized),
      passwordHash: await hashPassword(password || 'demo-password'),
    },
  });

  return {
    user: { id: created.id, email: created.email, name: created.name },
    created: true,
  };
}
