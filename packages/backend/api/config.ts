import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripeEnabled, stripePublishableKey } from '../lib/payments/stripe-client.js';

// Public, unauthenticated client config. The web app uses this to show/hide
// optional features (Google OAuth, Stripe checkout) without baking the decision
// into the build — buttons only appear once the server has credentials set.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    googleEnabled: Boolean(
      process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REDIRECT_URI,
    ),
    stripeEnabled: stripeEnabled(),
    stripePublishableKey: stripePublishableKey() ?? null,
  });
}
