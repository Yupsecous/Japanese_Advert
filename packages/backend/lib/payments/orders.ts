// Data layer for crypto payment orders (Drizzle). Order rows are append-mostly:
// created pending, then transitioned to confirmed (with the settling tx hash) or
// expired. The settling tx hash is unique across orders (DB partial index) so a
// single payment can never unlock two orders.

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '../db.js';
import { paymentOrders, type PaymentOrder } from '../schema.js';

export type NewOrder = {
  userId: string;
  tier: 'pro' | 'ultra';
  chain: string;
  asset: string;
  address: string;
  amountAtomic: string;
  decimals: number;
  amountUsd: string; // numeric column — pass as string to keep exact 2dp
  expiresAt: Date;
};

export async function createOrder(o: NewOrder): Promise<PaymentOrder> {
  const rows = await getDb()
    .insert(paymentOrders)
    .values({
      userId: o.userId,
      tier: o.tier,
      chain: o.chain,
      asset: o.asset,
      address: o.address,
      amountAtomic: o.amountAtomic,
      decimals: o.decimals,
      amountUsd: o.amountUsd,
      expiresAt: o.expiresAt,
    })
    .returning();
  return rows[0]!;
}

export async function findOrder(id: string, userId: string): Promise<PaymentOrder | undefined> {
  const rows = await getDb()
    .select()
    .from(paymentOrders)
    .where(and(eq(paymentOrders.id, id), eq(paymentOrders.userId, userId)))
    .limit(1);
  return rows[0];
}

// Has this on-chain tx already settled some order? (case-insensitive)
export async function isTxHashUsed(txHash: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: paymentOrders.id })
    .from(paymentOrders)
    .where(sql`lower(${paymentOrders.txHash}) = lower(${txHash})`)
    .limit(1);
  return rows.length > 0;
}

// Atomically flip pending -> confirmed, stamping the settling tx. Returns false
// if the order was no longer pending (already settled / expired). May throw a pg
// unique-violation (23505) if another order grabbed this tx first — the caller
// treats that as "tx already used".
export async function markConfirmed(id: string, txHash: string): Promise<boolean> {
  const rows = await getDb()
    .update(paymentOrders)
    .set({ status: 'confirmed', txHash, confirmedAt: new Date() })
    .where(and(eq(paymentOrders.id, id), eq(paymentOrders.status, 'pending')))
    .returning({ id: paymentOrders.id });
  return rows.length > 0;
}

export async function markExpired(id: string): Promise<void> {
  await getDb()
    .update(paymentOrders)
    .set({ status: 'expired' })
    .where(and(eq(paymentOrders.id, id), eq(paymentOrders.status, 'pending')));
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}
