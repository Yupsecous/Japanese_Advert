# Personify Ads

**An AI platform that turns a three-line brief into a complete, campaign-ready ad — copy, imagery, landing page, voiceover, and video.**

🌐 **Live:** [personify.my](https://personify.my) · Deployed on a Linux VPS with HTTPS, real accounts, and subscription billing.

---

## The problem it solves

Producing a single ad concept normally means a copywriter, a designer, a voice artist, and an editor — days of coordination for one variant. Testing five angles means doing that five times.

Personify Ads collapses the cycle. A marketer types three lines — product, audience, angle — and walks through a guided pipeline that produces every asset a campaign needs. Crucially, they **never write a prompt**. They describe changes the way they'd brief a human ("warmer, less corporate", "lighter background, more energy") and the system translates that into the technical parameters each AI model needs.

The result is a tool a non-technical marketer can actually drive, built on models that normally demand prompt-engineering expertise.

---

## Screenshots

<!--
  TODO — add 3–4 screenshots here before publishing. Suggested shots:
    1. The brief form (the three-line input) — shows how simple the entry point is
    2. A step showing two variants side by side with the refine box
    3. The Audience Console with the personalization grid
    4. The final package view with all assets assembled

  Save them to docs/screenshots/ and uncomment:

![Brief form](docs/screenshots/01-brief.png)
![Variant selection and plain-language refinement](docs/screenshots/02-refine.png)
![Audience personalization console](docs/screenshots/03-audience.png)
![Assembled campaign package](docs/screenshots/04-package.png)
-->

---

## How it works

Six gated stages. Each one produces two variants; the user picks one or refines it in plain language before the next stage unlocks.

```
Brief (product · audience · angle)
  │
  ├─ 1. Audience   →  segment the target, or personalize per-recipient
  ├─ 2. Copy       →  headline, caption, call-to-action
  ├─ 3. Image      →  hero visual
  ├─ 4. Script     →  20–40s spoken read + voice selection
  ├─ 5. Audio      →  synthesized voiceover
  └─ 6. Design     →  a working landing page
         │
         └─ Export →  Meta / X ad formats, composed video, ZIP package
```

Then three things happen that most AI tools don't do:

**Plain language becomes structured parameters.** "More aggressive" doesn't get passed to the image model. It's first converted into concrete art direction — `lighting: hard directional key light, single-source, dramatic shadows`, `composition: low angle, tight crop, slight tilt for tension`, plus a list of things to exclude. The user gets professional results without knowing any of that vocabulary.

**Nothing is generated twice.** Every stage is fingerprinted by the brief, the choices made upstream, and its own revision history. Explore a direction, back out, return to an earlier choice, and the whole downstream chain restores instantly from cache — no waiting, no repeat API charges.

**One campaign becomes hundreds of personalized ads.** The Audience Console takes a customer list and writes a tailored brief per recipient — adjusting tone, angle, and even the best *format* (text, image, video, or voice) for each person — then generates the matching assets in batch.

---

## What this project demonstrates

If you're evaluating me for a project, these are the capabilities it evidences:

| Capability | Where it shows up here |
|---|---|
| **AI/LLM product engineering** | Five providers orchestrated behind one pipeline, with automatic fallback routing when one fails |
| **Reliable structured output** | Every model response is schema-constrained and runtime-validated — no brittle string parsing |
| **Full-stack SaaS** | Accounts, email verification, password reset, Google sign-in, saved project history, admin dashboard |
| **Payments** | Stripe subscriptions (checkout, webhooks, customer portal) plus non-custodial crypto payments |
| **Cost control for AI products** | Per-user spend caps, plan-based model restrictions, a global daily ceiling, and a durable usage ledger |
| **Security** | Argon2 hashing, revocable server-side sessions, OAuth with token verification, rate limiting, SSRF protection |
| **Production deployment** | Live on a VPS behind Caddy with TLS, systemd service management, and PostgreSQL |
| **Internationalization** | Ships in six languages — and the chosen language propagates into the AI prompts, so generated copy is natively written, not translated |
| **Cross-platform** | Shared TypeScript core powering both a web app and an Android app |

---

## Technical highlights

**The direction translator.** An intermediate LLM layer converts plain-language feedback into structured, asset-specific modification objects — art-direction fields for images, tone and pacing for voice, emphasis and banned-phrase lists for copy. Because these are structured objects rather than concatenated text, refinements compose cleanly instead of degrading into prompt soup. It also works language-independently: a user types Japanese, and generation stays in Japanese end to end.

**Content-addressed caching with scoped invalidation.** Each stage is keyed by a hash of its true inputs. The subtle part is what *doesn't* invalidate: changing the voice invalidates only the audio, not the design; refining an image doesn't touch the copy above it. Nineteen unit tests pin these rules down, because they're easy to break silently.

**Cost governance under untrusted users.** Spend is estimated per model (a premium model costs several times a standard one, and image generation bills per megapixel), reserved before the call, and refunded on failure. Plan limits are enforced server-side, not just hidden in the UI — a free user requesting a premium model is silently downgraded rather than shown an error. The global daily cap **fails closed**: if the ledger can't be read, spending stops.

**In-browser video composition.** Campaign video is assembled client-side via Canvas and MediaRecorder — Ken Burns motion, crossfades, headline and CTA overlays, and word-level captions timed from the voiceover's character alignment data. No render farm, no server-side encoding.

---

## Stack

**Frontend** — React 18, TypeScript (strict), Vite, Tailwind, Zustand, Zod
**Backend** — Node, Express, PostgreSQL, Drizzle ORM
**Mobile** — React Native (Expo), built via EAS
**AI** — Anthropic Claude, OpenAI, fal.ai (Flux, Kling), ElevenLabs, OpenRouter fallback
**Infrastructure** — Linux VPS, Caddy (automatic TLS), systemd, Stripe, Resend

## Scale

| | |
|---|---|
| Code | ~33,700 lines across 197 files, TypeScript throughout |
| Tests | 121 unit tests |
| API | 30 endpoints |
| Database | 9 tables, 6 migrations |
| Languages | 6 (EN · 日本語 · PT · ES · FR · DE) |
| Type safety | `strict` mode, zero `any`, clean typecheck |

---

## Repository layout

```
src/                  Web app (React)
  components/         UI — one module per pipeline stage
  services/           AI orchestration, translator, caching, export
  store/              State machine, variant cache, auth, projects
  i18n/               Six-locale translations + prompt language directives

packages/
  backend/            Express API
    api/              30 route handlers (auth, AI proxies, payments, admin)
    lib/              Sessions, cost control, rate limiting, payment verification
    db/migrations/    PostgreSQL schema
  android/            React Native app (Expo)
  shared/             Types and pricing shared across web, mobile, backend
```

---

## Running locally

```bash
npm install
npm run dev          # web app  → http://localhost:5173
npm run backend:dev  # API      → http://localhost:3001
```

The app boots without any API keys or database — open-preview mode lets you navigate the full interface. Add provider keys to `packages/backend/.env.local` (see [`.env.example`](packages/backend/.env.example)) to enable generation, and a `DATABASE_URL` to enable accounts.

```bash
npm test         # 121 unit tests
npm run typecheck
```

---

## Notes

This is a private commercial codebase. The live application is public at [personify.my](https://personify.my); source access can be arranged for serious technical evaluation.

Built and maintained solo — architecture, implementation, deployment, and operations.
