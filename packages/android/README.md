# @advert/android

React Native / Expo app for the Director's Cockpit, targeting Android 10+
(API 29). v1 ships the auth + brief + copy flow as a working spine; the
remaining steps land in subsequent sessions (see HANDOFF.md at the repo
root).

## Architecture

- **Auth** — shared credentials → POST `/api/auth/login` → JWT stored in
  `AsyncStorage`, used as `Bearer` on every backend call.
- **Generation** — never calls the providers directly. Everything routes
  through `@advert/backend` so API keys stay on the server.
- **State** — `zustand` store, hydrated from `AsyncStorage` on launch
  (token only at the moment; brief is in-memory by design — users start
  a fresh brief each session).
- **Shared code** — types, pricing tiers, brand prompt assembly come from
  `@advert/shared`. The store, services, and screens are RN-specific.

## Local dev

```powershell
# From repo root, install workspace deps once:
npm install

# Start the backend (in one terminal):
npm run backend:dev

# Start Expo (in another):
npm run android:start
```

Then press `a` in the Expo CLI to open the Android emulator. The default
backend URL is `http://10.0.2.2:3001` (the emulator's loopback to the
host machine). Override via `app.json` → `expo.extra.backendUrl` for
device or prod testing.

## Sign-in

Default credentials match the web demo:

- Username: `IAmThatIAm`
- Password: `The FIrst Dream`

Both checked server-side. Configure in `packages/backend/.env.local`.

## What's in the app today

- Auth gate (server-checked)
- Brief screen (3 fields, validated)
- Copy step — generates 2 distinct variants, "show more" appends
- **Image step** — tier-aware Flux generation, plain-English refine, tier
  badge in the header opens a picker modal. Photoreal cues baked into
  every prompt. Tier choice persists in `AsyncStorage`.
- **Script step** — 2 tonally distinct voice-over scripts via Anthropic
  (4o-mini fallback). Tone label + duration estimate per card.

## What lands next (in order)

1. Per-variant refine + Claude critique on Image
2. Audio step (with kinetic-caption preview)
4. Design step
5. Platform exports (Meta + X ZIPs + carousel + AI motion video)
6. Audience Console (5 phases)
7. i18n parity (6 languages)
8. App icon, splash, signing, Play Store internal track
