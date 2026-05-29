// Google OAuth (Authorization Code + PKCE) via arctic. We read identity from
// the signature-verified id_token returned by the token endpoint — never an
// unauthenticated userinfo call — and pass email_verified through to the
// account-linking logic (lib/users.ts).

import { Google, generateState, generateCodeVerifier, decodeIdToken } from 'arctic';

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

// Exchanges the code for tokens and decodes the id_token claims. Throws if the
// exchange fails or the token lacks an email.
export async function exchangeGoogleCode(code: string, codeVerifier: string): Promise<GoogleIdentity> {
  const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
  const claims = decodeIdToken(tokens.idToken()) as {
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
