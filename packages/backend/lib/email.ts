// Transactional email (verification + password reset). Sender is chosen by
// whatever is configured, in priority order:
//   1. SMTP  (SMTP_HOST set)  — e.g. Titan: smtp.titan.email. Reuses the
//      domain's existing SPF/DKIM, no second provider to verify.
//   2. Resend (RESEND_API_KEY set) — HTTP API.
//   3. Neither — log the action link to the console (local dev), so the
//      verify/reset flows stay fully testable offline.

import nodemailer, { type Transporter } from 'nodemailer';

const RESEND_URL = 'https://api.resend.com/emails';

export function publicOrigin(): string {
  return process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173';
}

let transporter: Transporter | null = null;
function smtpTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // implicit TLS on 465; STARTTLS on 587
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
        : undefined,
    });
  }
  return transporter;
}

async function send(to: string, subject: string, html: string, devLink: string): Promise<void> {
  const from = process.env.EMAIL_FROM;

  const smtp = smtpTransport();
  if (smtp && from) {
    await smtp.sendMail({ from, to, subject, html });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && from) {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`);
    }
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(`[email] no sender configured — would send "${subject}" to ${to}\n         link: ${devLink}`);
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
