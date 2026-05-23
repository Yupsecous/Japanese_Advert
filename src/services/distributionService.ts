// Phase 3 — Distribution Simulator.
//
// Two functions:
//   - recommendChannel(customer, individualBrief): LLM-driven channel
//     selection. The "this person → this channel" mapping is part of the
//     personalization story; we ask Claude to pick from a 4-channel
//     whitelist given the customer's age, segment, and signal.
//   - simulateDelivery: cosmetic, no real network. Walks through a list
//     of DeliveryRecord-shaped intents with setTimeout-staged callbacks
//     so the UI can animate "queued → delivering → delivered" per card.

import { z } from 'zod';
import { messagesJson } from './anthropicClient';
import { AppError } from './errorMessages';
import type {
  Customer,
  DeliveryChannel,
  DeliveryRecord,
  GeneratedAssetSet,
  IndividualBrief,
} from '../types';

const CHANNELS: DeliveryChannel[] = ['line', 'instagram_dm', 'email', 'web_push'];

const RECOMMEND_SCHEMA = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          customer_id: { type: 'string' },
          channel: { type: 'string', enum: [...CHANNELS] as unknown as string[] },
        },
        required: ['customer_id', 'channel'],
        additionalProperties: false,
      },
    },
  },
  required: ['recommendations'],
  additionalProperties: false,
} as const;

const RecommendZ = z.object({
  recommendations: z.array(
    z.object({
      customer_id: z.string(),
      channel: z.enum(CHANNELS),
    }),
  ),
});

export type RecommendChannelsArgs = {
  customers: Customer[];
  briefCache: Record<string, IndividualBrief>;
  apiKey: string;
};

// Batched recommendation — one Claude call returns all channel choices for
// the customer list. Much cheaper than one call per customer.
export async function recommendChannels(
  args: RecommendChannelsArgs,
): Promise<Record<string, DeliveryChannel>> {
  const apiKey = args.apiKey.trim();
  if (!apiKey) throw new AppError('anthropic/missing-key');
  if (args.customers.length === 0) return {};

  const system = `You map customers to ad-delivery channels. For each customer, pick the channel most likely to perform.

Channels:
- line: LINE messenger — best for Japanese consumers, all ages, low-friction notification
- instagram_dm: Instagram direct message — best for under-40, visually-oriented, lifestyle / fashion / fitness segments
- email: best for over-40, executives, professionals, longer-form messaging, high-intent purchase categories
- web_push: best for tech-forward, recent engagers with the brand's site, time-sensitive offers

Pick one channel per customer based on age, segment, recent_interest, and social_signal_summary. Return only via submit_channel_recommendations.`;

  const lines: string[] = ['Customers:'];
  for (const c of args.customers) {
    const ib = args.briefCache[c.id];
    lines.push(
      `  - id: ${c.id} | age: ${c.age} | segment: ${c.segment} | interest: ${c.recentInterest} | format-pref: ${ib?.recommendedFormat ?? 'unknown'} | signal: ${c.socialSignalSummary}`,
    );
  }

  const raw = await messagesJson({
    apiKey,
    systemPrompt: system,
    userMessage: lines.join('\n'),
    toolName: 'submit_channel_recommendations',
    toolDescription:
      'Submit the customer-to-channel mapping. One channel per customer from the four-channel whitelist.',
    inputSchema: RECOMMEND_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: Math.max(800, args.customers.length * 60),
  });
  const parsed = RecommendZ.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      'anthropic/bad-response',
      `channel recommendation schema mismatch: ${parsed.error.message}`,
    );
  }
  const out: Record<string, DeliveryChannel> = {};
  for (const r of parsed.data.recommendations) {
    out[r.customer_id] = r.channel;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Simulated delivery — pure animation, no network
// ---------------------------------------------------------------------------

export type DeliveryStatus = 'queued' | 'delivering' | 'delivered';

export type SimulateDeliveryArgs = {
  customers: Customer[];
  channelMap: Record<string, DeliveryChannel>;
  generatedAssets: Record<string, GeneratedAssetSet>;
  // Called for each status transition so the UI can update the per-card
  // overlay.
  onStatus: (customerId: string, status: DeliveryStatus) => void;
  // Called once a delivery finishes, with the formal DeliveryRecord that
  // should be appended to the audience deliveryLog.
  onRecord: (record: DeliveryRecord) => void;
  // Optional cancellation — when aborted, in-flight stages finish but
  // pending ones are skipped.
  signal?: AbortSignal;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Walks the customer list in order with staggered timing. Each customer
// spends 80-250ms in "queued" and "delivering" before landing in
// "delivered". Total wall-clock for 10 customers ≈ 4-6 seconds — enough
// to feel like real-time delivery in the demo without dragging.
export async function simulateDelivery(args: SimulateDeliveryArgs): Promise<void> {
  // Stagger the start of each customer to make the animation cascade
  // diagonally across the grid rather than fire all at once.
  for (let i = 0; i < args.customers.length; i++) {
    if (args.signal?.aborted) return;
    const customer = args.customers[i]!;
    const channel = args.channelMap[customer.id] ?? 'email';
    const asset = args.generatedAssets[customer.id];
    if (!asset) continue;

    args.onStatus(customer.id, 'queued');
    // Stagger start
    await sleep(80 + Math.random() * 60);

    args.onStatus(customer.id, 'delivering');
    await sleep(180 + Math.random() * 220);

    args.onStatus(customer.id, 'delivered');
    args.onRecord({
      customerId: customer.id,
      channel,
      deliveredAt: new Date().toISOString(),
      format: asset.imageUrl ? 'image' : asset.script ? 'video' : 'text',
      assetId: customer.id,
    });
  }
}
