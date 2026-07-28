/**
 * Prisma client singleton.
 *
 * Next.js dev mode re-evaluates modules on every hot reload, which would
 * otherwise open a new SQLite connection each time until the process runs
 * out of file handles. Caching on globalThis is the standard guard.
 *
 * Moving to Postgres is a two-line change here plus the datasource
 * provider in prisma/schema.prisma — no call site changes.
 */
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? 'file:./ascplatform.db';
  const adapter = new PrismaBetterSqlite3({ url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
