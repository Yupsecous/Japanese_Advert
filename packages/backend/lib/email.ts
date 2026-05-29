// Transactional email via Resend's HTTP API (one POST, no SDK — matches the
// fetch-based style of the rest of the backend). If RESEND_API_KEY/EMAIL_FROM
// are not configured (local dev), we log the action link to the console
// instead of sending, so the verify/reset flows are fully testable offline.

const RESEND_URL = 'https://api.resend.com/emails';

export function publicOrigin(): string {
  return process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173';
}

async function send(to: string, subject: string, html: string, devLink: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    // eslint-disable-next-line no-console
    console.warn(`[email] RESEND not configured — would send "${subject}" to ${to}\n         link: ${devLink}`);
    return;
  }
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`);
  }
}

function layout(title: string, body: string, buttonLabel: string, url: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    <p style="font-size:14px;line-height:1.6;color:#444">${body}</p>
    <p style="margin:24px 0"><a href="${url}" style="background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px">${buttonLabel}</a></p>
    <p style="font-size:12px;color:#888">If the button doesn't work, paste this link into your browser:<br>${url}</p>
    <p style="font-size:12px;color:#888">If you didn't request this, you can ignore this email.</p>
  </div>`;
}

export async function sendVerificationEmail(to: string, rawToken: string): Promise<void> {
  const url = `${publicOrigin()}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  await send(
    to,
    'Verify your PersonifyAds email',
    layout('Confirm your email', 'Confirm your address to finish setting up your PersonifyAds account.', 'Verify email', url),
    url,
  );
}

export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
  const url = `${publicOrigin()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await send(
    to,
    'Reset your PersonifyAds password',
    layout('Reset your password', 'We received a request to reset your password. This link expires in 1 hour.', 'Reset password', url),
    url,
  );
}
