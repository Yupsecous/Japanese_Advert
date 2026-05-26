# @advert/backend

Vercel Functions proxy for the 4 generation providers (OpenAI, Anthropic,
fal.ai, ElevenLabs). The Android app and (optionally, in the future) the
web app authenticate against `/api/auth/login` with shared credentials,
receive a short-lived HMAC JWT, then call the provider routes with that
token. The server holds the actual API keys.

## Routes

| Method | Path                       | Purpose                                           |
| ------ | -------------------------- | ------------------------------------------------- |
| GET    | `/api/health`              | Liveness                                          |
| POST   | `/api/auth/login`          | Shared-creds login → JWT                          |
| POST   | `/api/openai/chat`         | OpenAI chat-completions pass-through              |
| POST   | `/api/anthropic/messages`  | Anthropic /v1/messages pass-through               |
| POST   | `/api/fal/flux`            | Tier-aware Flux call (Schnell / Dev / Pro 1.1)    |
| POST   | `/api/fal/kling-submit`    | Submit Kling v1.6 image-to-video job              |
| POST   | `/api/fal/kling-poll`      | Poll Kling job status; returns video URL on COMPLETED |
| POST   | `/api/elevenlabs/tts`      | ElevenLabs `/with-timestamps` TTS                 |

## Local dev

```powershell
cp .env.example .env.local
# Edit .env.local — set AUTH_JWT_SECRET (32+ chars) and your provider keys
npm install
npm run dev   # vercel dev, listens on http://localhost:3001
```

## Deploy

```powershell
npm run deploy
# Set the same env vars in the Vercel project settings (Production scope)
```

## Cost cap

`SESSION_COST_CAP_USD` enforces a per-session soft cap. The server tracks
cumulative spend in-memory per session id (issued at login). Once a session
exceeds the cap, further provider calls return 402. Restarting the function
resets the counter — for stricter enforcement, swap the in-memory Map in
`lib/cost.ts` for an Upstash Redis store.

## What's NOT here

- Per-user accounting — only the shared-credentials model. Add this when
  you move to per-user invites.
- Request body validation beyond the bare minimum — the provider proxies
  pass the body through trusting that the client built it correctly. If
  you ever expose this to non-trusted clients, tighten the schemas.
- Streaming — all routes buffer the upstream response. ElevenLabs streaming
  TTS would be a worthwhile addition for very long scripts.
