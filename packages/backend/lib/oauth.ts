// Google OAuth (Authorization Code + PKCE) via arctic. Identity comes from the
// id_token returned by the token endpoint — which we additionally verify
// against Google's JWKS (signature + issuer + audience + expiry) as
// defense-in-depth — never an unauthenticated userinfo call. email_verified is
// passed through to the account-linking logic (lib/users.ts).

import { Google, generateState, generateCodeVerifier } from 'arctic';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Google's public signing keys (cached + auto-refreshed by jose).
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

function googleClient(): Google {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth env not configured (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI)');
  }
  return new Google(clientId, clientSecret, redirectUri);
}

export function createGoogleAuthUrl(): { url: string; state: string; codeVerifier: string } {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = googleClient().createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);
  return { url: url.toString(), state, codeVerifier };
}

export type GoogleIdentity = {
  googleSub: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
};

// Exchanges the code for tokens and verifies the id_token against Google's
// JWKS (signature, issuer, audience=our client id, expiry). Throws if the
// exchange fails, the token doesn't verify, or it lacks sub/email.
export async function exchangeGoogleCode(code: string, codeVerifier: string): Promise<GoogleIdentity> {
  const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
  const { payload } = await jwtVerify(tokens.idToken(), GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const claims = payload as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!claims.sub || !claims.email) {
    throw new Error('Google id_token missing sub/email');
  }
  return {
    googleSub: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified === true,
    displayName: claims.name ?? null,
  };
}
