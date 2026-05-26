# Zero-to-APK in 30 minutes

End goal: a `directors-cockpit.apk` file on your laptop that you can email
to a prospect, who installs it on their Android phone, taps the icon, and
uses it immediately. No localhost, no config files, no API keys in their
hands.

Two pieces have to exist online:

1. **The backend** — deployed to Vercel (free). Holds the four provider keys.
2. **The APK** — built by Expo Application Services (EAS, free for personal
   use). Hardcodes the backend URL at build time.

This guide walks through both once. After the first time you'll do it in
~5 minutes per update.

---

## Part 1 — Deploy the backend to Vercel (10 minutes)

### 1. Create a free Vercel account

Go to <https://vercel.com/signup>. Sign in with GitHub or email. No credit
card needed.

### 2. Install the Vercel CLI

```powershell
npm install -g vercel
```

### 3. Link the backend folder to a Vercel project

```powershell
cd packages\backend
vercel link
```

Answer the prompts:
- "Set up and deploy?" → **Y**
- "Which scope?" → pick your personal account
- "Link to existing project?" → **N**
- "What's your project's name?" → `directors-cockpit-backend` (or anything)
- "In which directory is your code located?" → `./` (just press enter)

This creates a `.vercel/` folder (already in `.gitignore`) that tracks the
project link.

### 4. Add the secrets in the Vercel dashboard

Go to <https://vercel.com/dashboard> → click your project → **Settings →
Environment Variables**. Add these, **all scoped to Production**:

| Name | Value |
|---|---|
| `AUTH_USERNAME` | `IAmThatIAm` (or anything you want users to type) |
| `AUTH_PASSWORD` | `The FIrst Dream` (or anything stronger) |
| `AUTH_JWT_SECRET` | Random 32+ char string. Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_TOKEN_TTL_SECONDS` | `43200` (12 hours) |
| `OPENAI_API_KEY` | Your OpenAI key |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `FAL_API_KEY` | Your fal.ai key |
| `ELEVENLABS_API_KEY` | Your ElevenLabs key |
| `SESSION_COST_CAP_USD` | `20` (per-session safety cap; raise if you want bigger demos) |

### 5. Deploy

From `packages\backend\`:

```powershell
vercel deploy --prod
```

Wait ~30 seconds. The output shows your live URL, something like:

```
https://directors-cockpit-backend-abc123.vercel.app
```

**Copy this URL.** This is your "backend URL" — the APK will hardcode it.

### 6. Verify it works

```powershell
curl https://directors-cockpit-backend-abc123.vercel.app/api/health
```

Should return:

```json
{"ok":true,"name":"@advert/backend","version":"0.1.0","time":"..."}
```

If you get a 500, go back to Vercel → Logs and check what env var is missing.

---

## Part 2 — Build the APK with EAS (15 minutes)

### 1. Create a free Expo account

Go to <https://expo.dev/signup>. Sign in with GitHub or email. No card.

### 2. Bake your backend URL into the build config

Open `packages\android\eas.json` and find this line in both the `preview`
and `production` profiles:

```json
"BACKEND_URL": "https://REPLACE-WITH-YOUR-VERCEL-URL.vercel.app"
```

Replace with the URL you copied in Part 1 step 5. Save.

### 3. Log in to Expo

```powershell
cd packages\android
npx eas-cli login
```

Use your Expo account credentials.

### 4. Build the APK

From the repo root:

```powershell
npm run android:build:apk
```

This kicks off a cloud build on EAS. It takes 10-15 minutes. You don't
need to keep the terminal open — EAS will email you a link when it's done,
and you can watch progress at <https://expo.dev>.

When it finishes, the output gives you a URL like:

```
✔ Build finished
Android APK: https://expo.dev/artifacts/eas/abc123...apk
```

Open that URL on your laptop → it downloads `directors-cockpit.apk`.

### 5. Hand the APK to a prospect

Three ways:

**A. Email it.** Attach the .apk to an email. The recipient downloads it on
their Android phone, taps it, allows "Install from this source" when
prompted, and the app installs. Done.

**B. Host it.** Drop the .apk into a Google Drive or your own server and
share the link. Same install flow on the receiving end.

**C. Use EAS internal distribution.** Run `npx eas-cli build:run` — EAS
hosts the install page for you at `https://expo.dev/accounts/…/installs/…`.
Send that link; the prospect's phone opens it in the browser and walks
them through install.

### What the prospect experiences

1. Taps the APK or install link on their phone.
2. Android asks once: "Allow installs from this source?" → they tap allow.
3. App installs in ~5 seconds.
4. Taps the icon. App opens to the sign-in screen.
5. Enters the credentials you gave them (`IAmThatIAm` / `The FIrst Dream`
   unless you changed them in Vercel env vars).
6. They use the app. They never see the backend URL, never enter an API
   key, never know what fal.ai or Anthropic are.

You pay all the provider bills. The cost cap in the backend env
(`SESSION_COST_CAP_USD`) prevents any single prospect from running you a
huge bill if they go wild.

---

## Updates after the first time

When you change app code:

```powershell
npm run android:build:apk
```

That's it. ~10 minutes, new APK, send to prospects again. They reinstall
over the existing app — their settings persist (locale, image tier, voice).

When you change backend code:

```powershell
cd packages\backend
vercel deploy --prod
```

~30 seconds. No APK rebuild needed unless you changed the API shape.

---

## Optional: Google Play Store

If you eventually want prospects to find the app on Play Store instead of
sideloading an APK:

1. Pay Google $25 one-time at <https://play.google.com/console/signup>.
2. In `packages\android\package.json`, run `npm run build:aab` instead of
   `build:apk`. AAB (Android App Bundle) is what Play Store wants; APK is
   for sideloading.
3. Upload the AAB to Play Console → Production track.
4. Fill in the store listing (icon, screenshots, descriptions). Use the
   "Internal testing" track to bypass review and share with a closed
   prospect list — anyone you add by email gets an install link
   immediately, no review wait.

For a B2B demo tool, internal testing is the right track. Public production
adds compliance work (privacy policy, data handling disclosures) that
isn't worth it until you have paying customers.

---

## Cost reality check

Once everything is deployed:

| Service | Cost at low volume | What you pay for |
|---|---|---|
| Vercel | Free | Backend hosting |
| Expo / EAS | Free | APK builds (30 free / month — way more than you need) |
| Google Play Console | $25 once | Only if you want Play Store distribution |
| OpenAI / Anthropic / fal.ai / ElevenLabs | Pay-per-call | Real generation cost — capped per-session by the backend |

Your only ongoing cost is the provider API usage, which is capped by
`SESSION_COST_CAP_USD` in the backend env. Set it to whatever budget you
want per demo session.
