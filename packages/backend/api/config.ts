import type { VercelRequest, VercelResponse } from '@vercel/node';

// Public, unauthenticated client config. Lets the web app decide whether to
// show optional sign-in methods (e.g. "Continue with Google") without baking
// the decision into the build — the button only appears once the server
// actually has Google OAuth credentials configured.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    googleEnabled: Boolean(
      process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REDIRECT_URI,
    ),
  });
}
