# Personify Ads — Technical Brief

Talking points for a technical interview or client call. Organized so you can skim one section mid-call and quote concrete details.

**Live:** https://personify.my · **Scale:** ~33,700 lines across 197 files · 121 tests · 30 API endpoints · 9 tables · 6 languages

---

## 1. Elevator (30 seconds)

An AI ad-generation platform. A marketer enters three lines — product, audience, angle — and a six-stage pipeline produces copy, imagery, a voiceover script, synthesized audio, and a working landing page, then exports to Meta/X ad formats and composed video.

The interesting engineering is that **the user never writes a prompt**. They describe changes the way they'd brief a colleague, and a translation layer converts that into the structured parameters each model needs. Underneath, every stage is content-addressed so exploring and backtracking costs nothing.

It's a monorepo: React web app, Express/Postgres API, and a React Native Android client sharing one TypeScript core. Deployed on a VPS with real accounts, subscription billing, and server-enforced spend caps.

---

## 2. Stack

**Frontend** — React 18, TypeScript 5.6 (strict, no `any`), Vite 5, Tailwind v4, Zustand 4 (persist middleware), Zod 4, wavesurfer.js, jszip

**Backend** — Node 22, Express 4, PostgreSQL, Drizzle ORM, jose (JWT), @node-rs/argon2, arctic (OAuth), Stripe, nodemailer/Resend

**Mobile** — React Native via Expo, built with EAS

**Infrastructure** — Linux VPS, Caddy (automatic TLS), systemd, manual forward-only SQL migrations

### AI providers

| Provider | Model | Role |
|---|---|---|
| Anthropic | Claude Sonnet 4.6 | Copy, audience briefs, critique (vision), distribution, feedback |
| Anthropic | Claude Opus 4.7 | Landing-page generation (Pro/Ultra only) |
| OpenAI | gpt-4o-mini | Direction translator, image-prompt builder |
| fal.ai | Flux Schnell / Pro | Image generation, tiered by plan |
| fal.ai | Kling v1.6 | AI image-to-video (Ultra only) |
| ElevenLabs | TTS | Voiceover + account voice listing |
| OpenRouter | — | Fallback routing when a primary provider fails |

### Structured output — two patterns

**OpenAI:** native JSON-schema mode, `response_format: { type: 'json_schema', strict: true }`.

**Anthropic:** forced tool-use — declare one tool with the desired schema, force it with `tool_choice: { type: 'tool', name }`, parse the tool input. More reliable than asking for JSON in the message body.

Both paths declare the schema once as an `as const` JSONSchema object and Zod-validate the response. The schema drives both the API call and the parse, so they can't drift.

---

## 3. The direction translator

**This is the answer to "tell me something interesting you built."**

When a user types "more aggressive, less corporate", that string is **never sent to the generation model**. It first goes to a translator — a separate LLM call with hand-tuned few-shot examples — that converts it into a structured object shaped per asset type:

```
Copy  → { enrichedDirection, avoid[], emphasize[] }
Image → { lighting, composition, palette, mood, subject,
          background, energy, avoid[] }
Voice → { scriptTone, pace, delivery, emphasis, voiceCharacter }
```

"More aggressive" becomes `lighting: "hard directional key light, single-source, dramatic shadows"`, `composition: "low angle, tight crop, slight tilt for tension"`, `avoid: ["soft pastels", "even ambient lighting", "smiling subject"]`.

For images there's a second hop: an `imagePromptBuilder` call takes the brief, the approved copy, and the structured mods and writes a single-paragraph Flux prompt as prose. **The generation model never sees raw user text.**

**Why it matters:**

1. **Quality is decoupled from user skill.** The user doesn't need to know that Flux prefers prose over tag-lists, or that "more cinematic" means anamorphic wide plus golden-hour rim light plus a teal/orange split. The translator owns that vocabulary.
2. **Refinements compose.** Because mods are structured objects, brand dictionary + user refinement + applied critique layer cleanly instead of concatenating into prompt soup.
3. **Language-independent.** A user types Japanese; the translator emits a structured object whose prose fields are Japanese, feeding a Japanese-locked generation call. Output is natively written, not translated.

There's a dev-only harness at `/?test=1` that runs a 20-direction × 3-asset-type grid — 60 cells — for tuning the few-shots.

---

## 4. Content-addressed caching

**The answer to "what's a tricky problem you solved?"**

Every stage computes a hash (FNV-1a) over its true inputs: the brief, the approved variant IDs of each upstream stage, and its own ordered refine history. Before generating, it checks `cacheKey(stepId, hash)`. Hit → variants restore instantly with a "restored from your earlier choices" pill. Miss → call the API, write back.

The dependency chain, from `stepHash.ts`:

```
copy   : brief + copy.refines
image  : brief + copy.approved + image.refines
script : brief + copy.approved + image.approved + script.refines
audio  : brief + copy.approved + image.approved + script.approved
         + selectedVoiceId + audio.refines
design : brief + copy.approved + image.approved + design.refines
```

**The subtle part is what doesn't invalidate.** Voice belongs to audio's hash, not script's — changing voice invalidates only the audio. Design depends on the visual identity (copy + image) but not the spoken assets, so re-rendering a voiceover doesn't discard a generated landing page. An image refine scopes to image's own hash and never touches the copy above it.

**Downstream invalidation keeps cache entries.** When an upstream pick changes, downstream stages clear their variants and selections but *retain* their cache entries. So a user who explores a path, backtracks, picks differently, then returns to the original choice sees the entire cascade restore with zero API calls.

19 unit tests pin these scoping rules down — they're easy to break silently, and a wrong key serves a stale asset only after a specific refine-and-backtrack sequence.

Audio caching is in-memory only: the Blob isn't JSON-serializable, so `partialize` excludes it and demotes audio to `generating` on rehydrate. Everything else restores from sessionStorage.

---

## 5. Backend architecture

30 route handlers written in the Vercel function signature, mounted on plain Express via an `adapt()` wrapper — so the same code runs serverless or on a VPS. In production Express serves both the API and the static SPA from one origin, which keeps the session cookie first-party.

**Auth.** Two mechanisms normalized to one `AuthSession`:
- **Web** — opaque 32-byte token in an httpOnly cookie, with only its sha256 hash stored. Revocable on logout or password reset, which a stateless JWT can't be.
- **Android** — HS256 JWT via `Authorization: Bearer`.

Precedence is deliberate: if a Bearer header is present it resolves *only* via JWT and never falls through to the cookie. Passwords are argon2id. Google OAuth verifies the `id_token` against Google's JWKS rather than trusting the response body.

**Tables (9):** users, oauth_accounts, sessions, email_verification_tokens, password_reset_tokens, usage_events, projects, payment_orders, stripe_subscriptions.

**Payments, two paths:**
- **Stripe** — checkout, webhook-driven tier grants, customer portal.
- **Crypto, non-custodial** — EVM (Ethereum/Arbitrum/BNB), Bitcoin, Solana. No web3 library: raw JSON-RPC, manual ERC-20 `Transfer` log decoding against the keccak topic, address extraction from left-padded 32-byte topics, confirmation-depth checks, fail-closed on malformed fields. Funds go straight to the user's own addresses; the server never holds keys. 25 unit tests.

---

## 6. Cost control and abuse prevention

Provider calls cost real money and signup is open, so this is enforced server-side, not in the UI.

- **Model-aware estimation.** Opus ≈ 5× Sonnet; Flux's realistic tier bills per megapixel (rounded up), so dimensions are clamped and priced accordingly; TTS bills per character.
- **Reserve before, refund on failure** — closes a TOCTOU race where concurrent calls could both pass the cap check.
- **Tier clamping that degrades rather than errors.** A free user requesting Opus silently gets Sonnet; an over-tier image quality falls back to the best they're entitled to. Generation never breaks on a permission problem.
- **`max_tokens` ceilings** per tier, so a caller can't run up cost via a huge completion.
- **Global daily cap** across all users, computed from the durable `usage_events` ledger so it survives restarts — and it **fails closed**: if the ledger can't be read, spending stops. An earlier fail-open version meant any DB hiccup unlocked unlimited spend.
- **Token-bucket rate limiting** on every provider proxy.

---

## 7. Security

Hardened against an adversarial review (commit `20d1d21`):

- **SSRF** — Kling's `imageUrl` restricted to fal-owned hosts.
- **Rate-limit key spoofing** — `clientIp` reads `req.ip` with `trust proxy` off by default, so `X-Forwarded-For` can't be rotated to mint unlimited buckets.
- **CSV formula injection** neutralized in exports.
- Constant-time comparison on redeem codes and shared credentials.
- Generic error responses; upstream provider error bodies never reach the client.
- Baseline security headers, 1 MB body limit, graceful SIGTERM drain, periodic GC of expired sessions and tokens.

**Known gap:** no strict CSP yet. The Design stage renders LLM-generated React in an iframe via `@babel/standalone`, which needs a carefully scoped policy rather than a blanket one.

---

## 8. Internationalization

Six locales: EN, JA, PT, ES, FR, DE. The UI translation is routine; the interesting part is that **locale propagates into the prompts**. A `languageDirective(locale)` helper appends an instruction to the system prompt of every call producing user-visible output — copy, script, critique, and the translator itself — so the enriched direction is generated in the same language as the downstream output. Ad copy is natively written, not machine-translated.

---

## 9. Testing

**121 tests across 12 files** (Vitest). Run with `npm test`.

Weighted toward pure functions and state-machine invariants:
- `stepHash` — idempotence, brief invalidation, per-stage scoping rules (19)
- `steps.slice` — gating, cascade, downstream invalidation, reopen semantics (27)
- `directorsNotes` — the audit-trail markdown builder (12)
- payment verifiers — EVM, BTC, SOL, amount math (32)
- audience, effectiveness, batch generation, voice resolution (31)

Typed `AppState` factories live in `src/test/fixtures.ts`; that pattern kept slice tests short as the state shape grew.

**Honest gaps:** no component or E2E tests, and the translator and `llmService` — the most valuable modules — have no direct coverage. CI runs typecheck (web + backend), tests, and a production build on every push.

---

## 10. Things I'd change

Worth raising yourself; it reads better than being caught by it.

1. **Rate limiting and per-user spend counters are in-memory** — single-process, reset on restart. Fine for one VPS, wrong the moment it scales. Redis is the documented next step; the `usage_events` ledger is already the migration path to DB-backed enforcement.
2. **No CSP** (see §7).
3. **Test coverage is uneven** — deep on the state machine and payment verifiers, absent on the AI service layer.
4. **The measurement half is simulated.** Distribution, effectiveness, and the feedback loop generate projected data rather than real attribution. The architecture is real — learned insights flow back into every generation path — but it's currently learning from simulated outcomes. Wiring real platform APIs is the top roadmap item.
5. **No backups or monitoring yet** on the deployment.

---

## 11. Quick answers

**"How long?"** Started May 2026, solo — architecture, implementation, deployment, and operations.

**"Why these providers?"** Each is best-in-class for its slice: Claude for long-form copy quality and vision critique, gpt-4o-mini for cheap high-volume structured translation, Flux for image latency, ElevenLabs for voice. OpenRouter sits behind them as fallback so one provider outage doesn't halt a pipeline.

**"What was hardest?"** Cache-key correctness. A key that omits one upstream input serves a stale asset only after a specific sequence of refines and backtracks, and diagnosing it means tracing hash composition across stage boundaries rather than reading one function.

**"What would you build next?"** Real delivery integration — Meta and X ad APIs — so the feedback loop learns from actual campaign performance instead of simulated outcomes. The learning machinery already exists; it just needs real data.
