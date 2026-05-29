# Deploy the web app to personifyads.online

This is the runbook for shipping the **web** app (real accounts + PostgreSQL)
to a Linux VPS, served at `https://personifyads.online` behind Caddy
(automatic Let's Encrypt TLS). You run these steps on your VPS; nothing here
touches your machine automatically.

Architecture in production: one Express process serves **both** the built web
SPA (`dist/`) and the `/api/*` routes on `localhost:3001`. Caddy terminates
TLS and reverse-proxies to it. PostgreSQL runs locally. The browser talks only
to your domain — provider API keys never leave the server, and auth is an
httpOnly session cookie. (The Android app keeps working unchanged via its
Bearer-JWT `/api/auth/login`.)

> Do this **once** in order. Updates after the first time are the short
> section at the bottom. Steps 1 and 2 (Google + Resend) can be done in
> parallel while the VPS provisions.

---

## Prerequisites you provide

- A VPS (Ubuntu 22.04/24.04 LTS) with root/sudo SSH access and a public IPv4.
- The domain `personifyads.online` at a registrar where you can edit DNS.
- Secrets ready to paste into **one file** on the server (never into chat):
  the four provider keys, a Google OAuth client id/secret, a Resend API key,
  and two random 32-byte secrets you'll generate.

---

## Step 0 — DNS (do first; TLS depends on it)

At your registrar, add records pointing the domain at your VPS IP:

```
Type  Name   Value
A     @      <YOUR_VPS_IPV4>
A     www    <YOUR_VPS_IPV4>     (optional; Caddy will redirect www → apex)
```

DNS can take a few minutes to propagate. Caddy can't issue a certificate until
`personifyads.online` resolves to the VPS.

---

## Step 1 — Google OAuth client (for "Sign in with Google")

1. Go to <https://console.cloud.google.com/> → create a project (e.g.
   "PersonifyAds").
2. **APIs & Services → OAuth consent screen**: User type **External** →
   fill app name, support email, developer email → add scopes
   `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` → Save.
   (While in "Testing", add your own email under Test users; click
   **Publish app** when you want anyone to sign in.)
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `https://personifyads.online`
   - **Authorized redirect URIs:** `https://personifyads.online/api/auth/google/callback`
4. Copy the **Client ID** and **Client secret** — they go in `.env.local`
   as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

---

## Step 2 — Resend (verification + password-reset emails)

1. Sign up at <https://resend.com> → **Domains → Add Domain** →
   `personifyads.online`.
2. Resend shows DNS records (SPF `TXT`, DKIM `CNAME`/`TXT`, optionally a
   return-path). Add them at your registrar and click **Verify** until green.
   *(Emails silently fail to send until the domain is verified.)*
3. **API Keys → Create API Key** → copy it → `RESEND_API_KEY`.
4. Use a from-address on the verified domain:
   `EMAIL_FROM="PersonifyAds <noreply@personifyads.online>"`.

---

## Step 3 — VPS: install Node 22, PostgreSQL, Caddy

```bash
sudo apt update && sudo apt -y upgrade
# Node 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs git build-essential

# PostgreSQL
sudo apt -y install postgresql
sudo systemctl enable --now postgresql

# Caddy (official repo)
sudo apt -y install debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt -y install caddy
```

---

## Step 4 — Create the database

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE advert WITH LOGIN PASSWORD 'CHOOSE_A_STRONG_PASSWORD';
CREATE DATABASE advert OWNER advert;
SQL
```

Your `DATABASE_URL` is then:
`postgres://advert:CHOOSE_A_STRONG_PASSWORD@localhost:5432/advert`

---

## Step 5 — Get the code and build

```bash
sudo mkdir -p /opt/personifyads && sudo chown $USER /opt/personifyads
git clone <YOUR_REPO_URL> /opt/personifyads
cd /opt/personifyads
git checkout main           # or the branch you deploy from
npm ci                      # installs ALL deps — tsx/vite/drizzle-kit are needed
npm run build               # builds the web SPA into ./dist
```

> `@node-rs/argon2` ships prebuilt Linux binaries, so `npm ci` needs no
> compiler for it; `build-essential` is just insurance.

---

## Step 6 — Configure secrets

Generate the two random secrets:

```bash
node -e "console.log('SESSION_COOKIE_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('AUTH_JWT_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
```

Create `packages/backend/.env.local` (this file is gitignored). Use
`packages/backend/.env.example` as the template and fill in real values:

```ini
PORT=3001
PUBLIC_ORIGIN=https://personifyads.online
DATABASE_URL=postgres://advert:CHOOSE_A_STRONG_PASSWORD@localhost:5432/advert
SESSION_COOKIE_SECRET=<paste generated>
SESSION_TTL_SECONDS=2592000
GOOGLE_CLIENT_ID=<from step 1>
GOOGLE_CLIENT_SECRET=<from step 1>
GOOGLE_REDIRECT_URI=https://personifyads.online/api/auth/google/callback
RESEND_API_KEY=<from step 2>
EMAIL_FROM=PersonifyAds <noreply@personifyads.online>
AUTH_USERNAME=IAmThatIAm
AUTH_PASSWORD=The FIrst Dream
AUTH_JWT_SECRET=<paste generated>
AUTH_TOKEN_TTL_SECONDS=43200
OPENAI_API_KEY=<your key>
ANTHROPIC_API_KEY=<your key>
FAL_API_KEY=<your key>
ELEVENLABS_API_KEY=<your key>
SESSION_COST_CAP_USD=20
```

Lock it down: `chmod 600 packages/backend/.env.local`.

---

## Step 7 — Run the database migration

```bash
cd /opt/personifyads
node --import tsx packages/backend/migrate.ts
# → "+ apply 0001_init.sql ... Done."
```

(Re-running is safe — applied migrations are skipped.)

---

## Step 8 — Run the server as a systemd service

Create `/etc/systemd/system/personifyads.service`:

```ini
[Unit]
Description=PersonifyAds (web + API)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/personifyads
ExecStart=/usr/bin/node --import tsx packages/backend/server.ts
Restart=always
RestartSec=3
# .env.local is loaded by the app itself (dotenv), so no EnvironmentFile needed.

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /opt/personifyads     # so the service user can read files
sudo systemctl daemon-reload
sudo systemctl enable --now personifyads
sudo systemctl status personifyads          # should be "active (running)"
curl -s localhost:3001/api/health           # {"ok":true,...}
```

---

## Step 9 — Caddy (TLS + reverse proxy)

Replace `/etc/caddy/Caddyfile` with:

```caddy
personifyads.online {
    encode zstd gzip
    reverse_proxy localhost:3001
}

www.personifyads.online {
    redir https://personifyads.online{uri} permanent
}
```

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw --force enable
sudo systemctl reload caddy
```

Caddy now fetches a Let's Encrypt cert automatically (DNS from Step 0 must be
live). Visit **https://personifyads.online** — you should see the sign-in
screen.

---

## Step 10 — Smoke test

1. `curl https://personifyads.online/api/health` → `{"ok":true,...}`
2. In a browser: **Create account** → check your inbox → click the
   verification link (lands on `/login?verified=1`) → sign in → you reach the
   brief screen. Run one generation step (uses your server-side keys).
3. **Continue with Google** → consent → you're signed in.
4. **Forgot password** → reset email → set a new password → sign in.

If verification emails don't arrive: confirm the Resend domain is **verified**
and `EMAIL_FROM` uses that domain. If Google fails with `?oauth=...`: confirm
the redirect URI matches exactly and the app is published/your email is a test
user.

---

## Updating after the first deploy

```bash
cd /opt/personifyads
git pull
npm ci
npm run build
# only if the schema changed (new file in packages/backend/db/migrations/):
node --import tsx packages/backend/migrate.ts
sudo systemctl restart personifyads
```

Backend-only change with no schema change? Skip `npm run build`. No Caddy
changes are needed unless the domain changes.

---

## Notes / follow-ups

- **Provider keys are server-only.** The web bundle never contains them; all
  AI calls go through `/api/*` authenticated by the session cookie, capped per
  user by `SESSION_COST_CAP_USD`.
- **Secondary-locale auth strings** (PT/ES/FR/DE) currently fall back to
  English on the new sign-in/sign-up screens — functional, not yet localized.
- **Bundle size**: the SPA is still one ~234 KB-gzip chunk (pre-existing). A
  code-splitting pass is a worthwhile follow-up but not a blocker.
- **Cost cap** resets on process restart (in-memory); `usage_events` is
  written durably for a future DB-backed cap.
