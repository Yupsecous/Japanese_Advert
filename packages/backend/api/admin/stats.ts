import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, count, sum } from 'drizzle-orm';
import { authenticate } from '../../lib/auth.js';
import { sendError } from '../../lib/respond.js';
import { isAdminEmail, findUserById } from '../../lib/users.js';
import { getDb } from '../../lib/db.js';
import { users, usageEvents, paymentOrders, sessions } from '../../lib/schema.js';

// GET /api/admin/stats — operator dashboard data.
// Auth-gated: requires a valid session AND the user's email must be in ADMIN_EMAILS.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ code: 'method/not-allowed' });
    return;
  }

  const session = await authenticate(req);
  if (!session) return sendError(res, 401, 'auth/unauthorized');

  const user = await findUserById(session.sub);
  if (!user || !isAdminEmail(user.email)) {
    return sendError(res, 403, 'tier/forbidden');
  }

  const db = getDb();

  const [
    usersByTier,
    newUsersLast7,
    newUsersLast30,
    cryptoRevenue,
    pendingOrders,
    todaySpend,
    activeSessions,
    stripeStats,
  ] = await Promise.all([
    // Users grouped by tier
    db
      .select({ tier: users.tier, cnt: count() })
      .from(users)
      .groupBy(users.tier),

    // New signups in last 7 days
    db
      .select({ cnt: count() })
      .from(users)
      .where(sql`created_at > now() - interval '7 days'`),

    // New signups in last 30 days
    db
      .select({ cnt: count() })
      .from(users)
      .where(sql`created_at > now() - interval '30 days'`),

    // Confirmed crypto revenue (all time)
    db
      .select({
        tier: paymentOrders.tier,
        cnt: count(),
        total: sum(paymentOrders.amountUsd),
      })
      .from(paymentOrders)
      .where(sql`status = 'confirmed'`)
      .groupBy(paymentOrders.tier),

    // Pending (unexpired) crypto orders
    db
      .select({ cnt: count() })
      .from(paymentOrders)
      .where(sql`status = 'pending' AND expires_at > now()`),

    // API spend today (all users)
    db
      .select({ total: sum(usageEvents.costUsd) })
      .from(usageEvents)
      .where(sql`created_at > now() - interval '24 hours'`),

    // Active (non-revoked, non-expired) sessions
    db
      .select({ cnt: count() })
      .from(sessions)
      .where(sql`revoked_at IS NULL AND expires_at > now()`),

    // Stripe subscriptions summary (raw SQL — table added by migration 0006)
    db.execute<{ status: string; cnt: string }>(sql`
      SELECT status, count(*)::text AS cnt
      FROM stripe_subscriptions
      GROUP BY status
    `).then((r) => r.rows).catch(() => [] as { status: string; cnt: string }[]),
  ]);

  // Shape tier counts into a map
  const tierCounts: Record<string, number> = { free: 0, pro: 0, ultra: 0 };
  for (const row of usersByTier) tierCounts[row.tier] = Number(row.cnt);

  // Shape crypto revenue
  const cryptoByTier: Record<string, { count: number; usd: number }> = {};
  for (const row of cryptoRevenue) {
    cryptoByTier[row.tier] = {
      count: Number(row.cnt),
      usd: Number(row.total ?? 0),
    };
  }

  const stripeByStatus: Record<string, number> = {};
  for (const row of (stripeStats as { status: string; cnt: string }[])) {
    stripeByStatus[row.status] = Number(row.cnt);
  }

  res.status(200).json({
    users: {
      total: Object.values(tierCounts).reduce((a, b) => a + b, 0),
      byTier: tierCounts,
      newLast7Days: Number(newUsersLast7[0]?.cnt ?? 0),
      newLast30Days: Number(newUsersLast30[0]?.cnt ?? 0),
    },
    sessions: {
      active: Number(activeSessions[0]?.cnt ?? 0),
    },
    crypto: {
      pendingOrders: Number(pendingOrders[0]?.cnt ?? 0),
      confirmed: cryptoByTier,
      totalRevenueUsd: Object.values(cryptoByTier).reduce((a, b) => a + b.usd, 0),
    },
    stripe: {
      byStatus: stripeByStatus,
      activeSubscriptions: (stripeByStatus['active'] ?? 0) + (stripeByStatus['trialing'] ?? 0),
    },
    spend: {
      last24hUsd: Number(todaySpend[0]?.total ?? 0),
    },
  });
}
