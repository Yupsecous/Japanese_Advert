# Android build — handoff

What landed in the first build session, what remains, and how to run
each piece. This document is the source of truth for the next session
to pick up from.

> **For shipping the app to a prospect** (not just testing locally), see
> [DEPLOY.md](DEPLOY.md) — the 30-minute zero-to-APK guide. That's the
> "common app" path: deploy backend once + build APK once + hand the
> .apk to anyone who has an Android phone.

---

## Repo shape now

```
d:\Advert
├── src/                       ← existing web app (untouched)
├── public/, scripts/, ...     ← web app supporting files
├── package.json               ← root, now defines workspaces
├── packages/
│   ├── shared/                ← types + pricing + brand prompt
│   │   ├── package.json       → @advert/shared
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── pricing.ts
│   │       └── brand.ts
│   ├── backend/               ← Vercel Functions proxy
│   │   ├── package.json       → @advert/backend
│   │   ├── vercel.json
│   │   ├── .env.example
│   │   ├── README.md
│   │   ├── lib/
│   │   │   ├── auth.ts        ← HMAC JWT issue/verify + shared creds
│   │   │   ├── cost.ts        ← per-session cost cap
│   │   │   └── respond.ts     ← error response helpers
│   │   └── api/
│   │       ├── health.ts
│   │       ├── auth/login.ts
│   │       ├── openai/chat.ts
│   │       ├── anthropic/messages.ts
│   │       ├── fal/flux.ts
│   │       ├── fal/kling-submit.ts
│   │       ├── fal/kling-poll.ts
│   │       └── elevenlabs/tts.ts
│   └── android/               ← Expo TypeScript app
│       ├── package.json       → @advert/android
│       ├── app.json
│       ├── babel.config.js
│       ├── tsconfig.json
│       ├── index.ts
│       ├── App.tsx
│       ├── assets/            ← (placeholder for icon.png, splash.png)
│       └── src/
│           ├── theme.ts
│           ├── navigation.ts
│           ├── store/index.ts
│           ├── services/
│           │   ├── backend.ts        ← thin client for the 7 routes
│           │   └── copyService.ts    ← Anthropic-first, OpenAI fallback
│           └── screens/
│               ├── AuthScreen.tsx
│               ├── BriefScreen.tsx
│               ├── CopyScreen.tsx
│               └── NextStepPlaceholderScreen.tsx
└── HANDOFF.md                 ← this file
```

The existing web app at the repo root is **completely unchanged**.
`npm test` / `npm run build` still pass (verified 85/85 tests + clean
production build).

---

## What you need to do once

### 1. Install workspace deps

```powershell
npm install
```

This will install **all** workspace deps (web at root + backend + shared
+ android). First run takes ~3-5 minutes because of Expo + RN.

### 2. Configure the backend

```powershell
cp packages/backend/.env.example packages/backend/.env.local
```

Then edit `packages/backend/.env.local`:

- `AUTH_USERNAME` — defaults to `IAmThatIAm`
- `AUTH_PASSWORD` — defaults to `The FIrst Dream`
- `AUTH_JWT_SECRET` — generate one:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `FAL_API_KEY`, `ELEVENLABS_API_KEY` —
  the four provider keys

### 3. (Optional now, required for deploy) Set up Vercel

```powershell
cd packages/backend
npx vercel link        # creates .vercel/, links to a Vercel project
```

For deploy:

```powershell
npm run backend:deploy
```

Then set the same env vars in the Vercel dashboard under
**Settings → Environment Variables**.

---

## How to run each piece

### Backend (local)

```powershell
npm run backend:dev
```

Listens on `http://localhost:3001`. Test it:

```powershell
curl http://localhost:3001/api/health
# Should return { ok: true, name: '@advert/backend', ... }
```

### Web (unchanged)

```powershell
npm run dev          # vite, port 5173
npm test             # 85 tests
npm run build        # production bundle into dist/
```

### Android

```powershell
npm run android:start
```

This starts Expo. Press **`a`** to open the Android emulator (you need
Android Studio installed with at least one AVD). Or scan the QR code
with the Expo Go app on a physical device — but you must update the
backend URL in `packages/android/app.json` to your machine's LAN IP
(not `10.0.2.2`).

### End-to-end smoke test

1. Start the backend: `npm run backend:dev`
2. Start Android: `npm run android:start`, press `a`
3. App opens to the sign-in screen
4. Enter `IAmThatIAm` / `The FIrst Dream`
5. Land on the Brief screen
6. Fill all three fields, tap **Start**
7. Copy step generates two variants from your `ANTHROPIC_API_KEY` (or
   falls back to OpenAI if Anthropic 5xxs)
8. Tap one to advance to the placeholder screen — confirms the end-to-end
   plumbing works

---

## What's NOT in v1 yet

These all need to ship in subsequent sessions to reach feature parity
with the web app. Listed in recommended build order.

### Android feature work

1. ✅ **Image step (landed)** — tier-aware Flux generation, plain-English
   refine, tier badge + picker modal, photoreal-cue prompt builder.
   Per-variant refine and critique (Claude) still pending; the current
   refine button re-generates the whole batch like the web's "main"
   refine box.
2. ✅ **Script step (landed)** — Claude Sonnet via the Anthropic proxy
   (4o-mini fallback). 2 tonally distinct variants with toneDescription
   and durationEstimate per card.
3. ✅ **Audio step (landed)** — voice picker (modal listing every voice
   on the connected ElevenLabs account), TTS generation via
   `/api/elevenlabs/tts`, base64 audio decoded to a local file with
   `expo-file-system`, playback with `expo-av`. Alignment data is
   preserved on the variant for kinetic captions (still to land).
   Voice selection persists per-device. Kinetic-caption rendering and a
   waveform view still pending.
4. ✅ **Design step (landed)** — claude-opus-4-7 via the Anthropic proxy
   generates a single-file React + Tailwind landing-page component
   (~30-60s). Rationale shown above a scrollable monospace code box.
   "Copy code" button writes the TSX to the clipboard via
   `expo-clipboard`. Refine box accepts plain-English direction. Finish
   button returns to a fresh brief.
5. ✅ **i18n parity (landed)** — 6 locales (EN/JA/PT/ES/FR/DE). EN + JA
   have full coverage; the other 4 cover headings, common buttons, and
   high-frequency strings, falling back to EN for anything missing.
   Language picker pill in the auth + brief headers; choice persists
   per-device via AsyncStorage. Web i18n dict is unchanged — the two
   dictionaries will converge into @advert/shared later.
3. **Audio step** — `/api/elevenlabs/tts` (with-timestamps); decode the
   base64 audio to a file via `expo-file-system`; play with `expo-av`;
   render the alignment as kinetic captions.
4. **Design step** — generate the single-file landing-page TSX; render
   in a syntax-highlighted preview; long-press to copy.
5. **Platform exports** — Meta + X ZIPs. Use `expo-file-system` for the
   ZIP (port `jszip`) and `expo-sharing` for the share intent. AI motion
   video is the only video path on Android (no Canvas pipeline) — call
   `/api/fal/kling-submit` then poll `/api/fal/kling-poll`.
6. **Audience Console** — 5 phases. CSV/JSON import via
   `expo-document-picker`. Batch generation can reuse all the
   backend routes; effectiveness sim is pure client logic from
   `src/services/effectivenessService.ts`.
7. **i18n** — port `src/i18n/index.ts` into `@advert/shared/src/i18n.ts`,
   wire the same `useT` hook into RN screens. 6 locales.
8. **Generation quality panel** — port the Settings drawer to a modal;
   tier picker + video provider picker; persist to `AsyncStorage`.

### Polish

- App icon + splash (1024×1024 PNG, replaces `assets/icon.png` and
  `assets/splash.png` placeholders)
- Google Play internal track build via `eas build --profile preview --platform android`
- Crash + analytics: `expo-application` + Sentry RN SDK

### Backend hardening (optional)

- Replace in-memory cost-cap Map (`packages/backend/lib/cost.ts`) with
  Upstash Redis if you want the cap to survive function restarts
- Add request-body schema validation on the OpenAI + Anthropic proxies
  (currently pass-through)
- Add streaming for very long ElevenLabs TTS calls

### Eventually

- **Web migration**: switch the web app to also route through the
  backend (right now web still calls providers directly with user-supplied
  keys). Adds same-origin posture, removes the sessionStorage key
  exposure. Web becomes a thin client just like Android.

---

## Architectural notes worth keeping

### Why the backend exists

Three reasons, in order of importance:

1. **Play Store reality** — if you ever publish on Play Store, embedded
   API keys are extractable from the APK. Backend is mandatory there.
   Internal distribution lets you skip this, but you'd repaint the
   architecture in 3 months — better to do it now.
2. **Cost cap** — server-side enforcement of `SESSION_COST_CAP_USD`.
   Client-side caps are bypassable; server caps are not.
3. **Provider key rotation** — one place to swap a key when (not if) you
   need to rotate.

### Why Kling-only video on Android

Canvas + MediaRecorder is the entire web slideshow pipeline. Porting it
to RN requires `react-native-skia` + a native MediaCodec module, which
is 1.5-2 weeks of work and a maintenance burden forever. Kling is paid
($0.35/clip) but gives noticeably more realistic motion and lets us
skip the native module. We treat the slideshow as a web-only feature
going forward.

### Why shared credentials for auth

Same model as the web demo. The internal team already knows the
credentials. Per-user accounts are a v2 concern — when you onboard a
second tenant, swap `checkSharedCredentials` for an actual user DB.
The JWT shape (`{ sub, sid }`) already supports per-user accounting; you
just change what fills `sub`.

### Why the cost cap is in-memory

Internal use. Vercel function restarts are infrequent enough that an
in-memory Map per-session is good enough. If you ever shipped this to
a high-volume tenant, swap for Upstash Redis (free tier covers this
use case at ~10k req/day).
