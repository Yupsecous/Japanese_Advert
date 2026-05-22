# Director's Cockpit — Technical Brief for AI Engineer Recruiter Call

A talking-points document covering the project end-to-end. Designed so you can skim the section you need mid-call and quote concrete details.

---

## 1. Elevator (30 seconds)

A browser-only ad creative pipeline that turns a 3-line brief into four sequenced deliverables — copy, image, script, audio — by orchestrating four AI providers (OpenAI, Anthropic, fal.ai, ElevenLabs) through a state machine with content-addressed caching. The interesting AI-engineering piece is a "direction translator" layer: instead of letting the user write prompts, they describe what they want in plain English or Japanese, and an LLM-in-the-middle converts that into structured, asset-type-specific modifications (lighting/composition/palette for image, pace/delivery/voice-character for voice, etc.) which then drive the actual generation calls.

---

## 2. Stack

### Frontend
- **React 18** + **TypeScript 5.6** (strict mode, no `any`)
- **Vite 5** build, ES2022 target, browser-only — no backend, no server-side code
- **Tailwind v4** with the Vite plugin
- **Zustand 4** with `persist` middleware over `sessionStorage` for state
- **Zod 4** for runtime validation of every LLM response
- **wavesurfer.js** for the audio waveform player
- **jszip** for client-side ZIP packaging of the final assets

### AI providers and what each does
| Provider | Model | Role |
|----------|-------|------|
| OpenAI | `gpt-4o-mini` | Direction translator, image-prompt builder, script generator, copy fallback |
| Anthropic | `claude-sonnet-4-6` | Primary copy generator (when key is configured), image critique (with vision) |
| fal.ai | Flux Schnell | Image generation (768×960, 4 inference steps for sub-3s latency) |
| ElevenLabs | TTS | Final voiceover render; account-voice listing |

### Structured-output extraction
Two different patterns, one per provider:
- **OpenAI**: native JSON schema mode via `response_format: { type: 'json_schema', strict: true }`.
- **Anthropic**: tool-use pattern. We declare a single tool (e.g. `submit_copy_variants`) with the desired schema, force the model to call it with `tool_choice: { type: 'tool', name: ... }`, and parse the tool input as the structured output. This is more reliable than asking for JSON in the message body.

Both schemas are declared once in the service as `as const` JSONSchema objects, then Zod-validated on the way back. Same shape, two parsers — the schema is the source of truth for both the API call and the Zod parse.

### Hosting
Vercel for share-links, plus a self-host path for a Windows VPS via `vite preview` on port 8080. No database, no auth server, no background workers. Everything that hits an AI provider runs in the visitor's browser using keys they enter into the Settings drawer.

### Testing
**Vitest**, 58 tests across 4 files:
- Step-hash function spec (idempotence, brief invalidation, scoping rules)
- Director's-notes markdown builder
- Voice library `resolveVoice` (synthesizes a voice card from history when the stored id isn't in the hardcoded library)
- Store slice state-machine invariants (gating, cascade, downstream invalidation, reopenStep semantics)

Test fixtures live in `src/test/fixtures.ts` as a typed factory for `AppState` doubles — that pattern kept the slice tests short even as the state shape grew.

---

## 3. Architecture

### The pipeline
Four steps, sequential and gated. Each step has a status (`pending | generating | options | refining | approved`) and can't unlock until the previous one is `approved`. The active step is a pure derivation: first non-approved step in `STEP_ORDER`. When all four are approved, the FinalPackage view replaces the StepShell.

### State management — Zustand slices
```
store/
  index.ts              combined store + persist config + derived selectors
  settings.slice.ts     API keys, validations, drawer state, locale
  brief.slice.ts        the 3-field brief form state
  steps.slice.ts        the state machine + variant cache
```
The store is a single Zustand store composed from three slice creators. The `partialize` config in `persist` excludes audio blobs (Blob doesn't survive JSON serialization) and demotes audio status to `generating` on rehydrate so it auto-regenerates on reload.

### Variant cache — content-addressed by step hash
This is the piece I'd talk about if asked "what's a tricky problem you solved?"

Every step computes a **step hash** from its inputs: the brief, the approved variant ids of every upstream step, and its own ordered refine history. Before generating, the step checks the cache for an entry at `cacheKey(stepId, hash)`. If found, variants restore instantly and the user sees a "Restored from your earlier choices" pill. If not, the API is called and the result is cached.

The interesting part is **downstream invalidation**: when an upstream selection changes, downstream steps reset their variants/selectedIndex/critiques *but keep their cache entries*. So if a user backtracks, picks a different copy variant, then backtracks again to the original copy variant, the entire downstream cascade (image, script, audio) restores from cache with zero API calls.

The hash is scoped per-step. Voice-pick events contribute to the script hash but not to upstream hashes, and a refine-direction in image only invalidates the image step's own hash, not copy. There's a small test file (`stepHash.test.ts`) that pins down these scoping rules — they're easy to break otherwise.

Audio cache is in-memory only because the Blob is not serializable; on reload, audio regenerates while everything else restores from sessionStorage.

### The direction translator — the unique AI-engineering piece

This is the answer to "tell me something interesting you built."

When a user types "more aggressive, less corporate" or "the guy should smile more", we **don't pass that string to the generation model**. Instead we route through a translator: a separate `gpt-4o-mini` call with hand-tuned few-shot examples that converts the plain-language direction into a structured object shaped by asset type:

- **Copy** → `{ enrichedDirection, avoid[], emphasize[] }`. The `avoid` list is then appended as banned terms to the copy generator's system prompt.
- **Image** → `{ lighting, composition, palette, mood, subject, background, energy, avoid[] }`. Concrete photographic terminology a director would use.
- **Voice** → `{ scriptTone, pace, delivery, emphasis, voiceCharacter }`.

These structured mods then feed the actual generation. For images, an *additional* LLM call (the `imagePromptBuilder`) takes the brief + approved copy + structured mods and writes a single-paragraph Flux prompt as prose. The model never sees raw user text — only the structured intermediate.

**Why this matters**:
1. **Locale-independent generation**. User can type Japanese; the translator outputs a structured object whose prose fields are also Japanese, which then feeds a Japanese-locked generation call.
2. **Composable refinements**. Because mods are structured, future versions can layer them (brand dictionary → user refinement → critique application) without prompt-soup.
3. **Quality is decoupled from user skill**. The user doesn't need to know that Flux prefers prose over tag-lists, or that "more cinematic" means "anamorphic wide + golden-hour rim light + teal/orange split". The translator owns that knowledge.

There's a dev-only route at `/?test=1` that runs a 20-direction × 3-asset-type grid (60 cells) against the translator. That's the tuning harness for the few-shots.

### i18n with prompt-locale propagation
Just added a Japanese version. The interesting part isn't the UI translation — it's that the **chosen locale propagates into the system prompts**. A `languageDirective(locale)` helper appends a sentence like "出力は必ずすべて自然な日本語で書いてください" to the system prompt for every LLM call that produces user-visible output (copy, script, critique). The translator gets the same treatment so the enriched direction it produces matches the downstream generation language.

One exception: the Flux prompt builder is *always* English-locked, with an explicit note that says "the user message may be in Japanese; translate as you compose, the final Flux prompt must be English" — because image models perform much worse on non-English prompts.

So locale-aware generation is a single helper, not a tangle. ~20 lines of code wire it across copy/script/translator/critique.

### Image critique — Claude Sonnet with vision
The Critique button on each image variant sends the image URL plus the brief and approved copy to Claude Sonnet via the `/v1/messages` endpoint with an `image` content block. The system prompt frames Claude as a senior creative director with a specific structure: open with what's working, identify what's losing momentum, end with one concrete actionable alternative. Few-shot examples lock the voice. Returns prose, no markdown.

The user can then click "Apply this critique" which pipes the critique text *as a refine direction* back through the translator → generation pipeline. The same pathway as a user-typed refinement, just with much richer source text. The history log distinguishes `refine` from `critique-applied` so the audit trail is honest.

### Browser-only architecture & key handling
No backend. The visitor enters their own four API keys into a Settings drawer. Keys live in `sessionStorage` only — never transmitted to any server other than the four providers themselves. There's a validation flow that hits each provider's cheapest auth-checking endpoint (`/v1/models` for OpenAI/Anthropic, `/v1/user` for ElevenLabs, and a deliberate empty POST to `fal.run/fal-ai/flux/schnell` that produces a 422 schema error on a valid key — because their legacy `/applications` endpoint returns 401 for valid keys).

This architecture is unusual and gets challenged: "isn't browser-side API key storage a security risk?" The answer is yes if you give one key to many users; no if each visitor uses their own key (which is the demo's posture). For an enterprise version the same orchestration layer would live behind a server, with the keys server-side and per-user auth in front. The browser-only path is for the prospect demo specifically.

### Graceful degradation per missing key
Each missing provider has a defined fallback:
- **No OpenAI** → the brief form is hidden; an OnboardingState card is shown instead with a "Open Settings" button.
- **No Anthropic** → the Critique button on each image variant is disabled with a tooltip; copy generation falls back to `gpt-4o-mini` with a small upsell banner.
- **No ElevenLabs, sample preset baked** → audio step falls back to the baked sample with a "Demo audio shown" banner.
- **No fal.ai** → the image step blocks with a "Keys required" panel pointing to Settings.

These were all designed because the demo gets shown cold to prospects who haven't entered keys yet, and the worst thing for a sales demo is a red error screen.

### Sample preset — preload for instant first impression
A separate script (`scripts/bake-sample.ts`) takes a finished session's state, downloads every cached image from `fal.media`, copies them to `public/samples/images`, copies the final audio to `public/samples/audio`, rewrites all URLs to relative paths, and emits a `preset.json`. On load, the BriefForm offers a "Try sample brief" button that hydrates the entire pipeline state in milliseconds with zero network calls. The cache-restore pill fires through all four steps as the cascade rolls.

This is the "wow" moment for a sales demo — prospect goes from 0 to all-four-assets in under a second.

---

## 4. The hard problems (concrete things to mention when asked)

### "Tell me about a hard problem you solved"

**Cache invalidation across a 4-step state machine.** Getting the rules right took several iterations. The naive version (clear-everything-on-any-upstream-change) regenerated assets that were still valid. The over-clever version (keep-everything-and-let-hashes-collide) caused silent stale data. The current model — selection change clears variants but keeps the cache entries, hashes include only the inputs that genuinely affect that step's output, downstream invalidation cascades but cache rehydrates — needed a clear specification (the D7 doc that became the test file). I'd point to `stepHash.test.ts` and `steps.slice.test.ts` as the artifacts of that specification work.

### "How do you handle non-determinism?"

Three answers:
1. **Variant generation is temperature-0.85 by design** — we want diversity between the two variants. We embrace the non-determinism instead of fighting it.
2. **Structured outputs everywhere** — every LLM response goes through Zod after schema-strict generation. A malformed response throws an `AppError` with a code, not a silent type error.
3. **The cache absorbs the non-determinism economically**. A user who revisits the same brief gets the same first run back, even though a fresh call would produce different variants. This matters more for cost and UX than for correctness.

### "How do you test LLM systems?"

Two layers:
1. **Pure logic tests** for everything around the LLM — hash function, state machine, error mapping, markdown builders. These are deterministic and fast.
2. **The translator harness** at `/?test=1` runs a 60-cell grid (20 directions × 3 asset types). It's not run in CI — it's a developer tool for evaluating prompt changes. Honest answer: I don't have automated quality eval on the generation calls themselves yet. That's one of the next-version items.

### "How do you handle errors from four different providers?"

Single `AppError` class with stable error codes (`openai/auth-failed`, `fal/no-credits`, `eleven/voice-not-found`, etc.). Every service maps its provider's specific failures to one of these codes. The `humanize()` function (now locale-aware) maps codes to user-facing strings. Technical detail goes to `console.debug`, not the UI. There's a shared `InlineError` component that renders the message + a Try Again button + an Open Settings button when the error code is key-related.

Specific case worth mentioning: ElevenLabs `voice-not-found` triggers a "← Pick a different voice" recovery button that drops the user back to the voice picker — because that error usually means the user picked a hardcoded fallback voice that isn't in their actual account. Discovery + recovery in one surface.

### "Cost and latency?"

Per pipeline completion (USD, approx):
- Copy (Claude Sonnet, 2 variants) ~$0.02
- Image (Flux Schnell, 2 images) ~$0.03
- Script (gpt-4o-mini, 2 variants) ~$0.005
- Audio (ElevenLabs 30s) ~$0.03
- Critique (Claude Sonnet vision, optional) ~$0.01

**Total ~$0.10 per full run**, dominated by ElevenLabs audio. The cache means re-traversal is free.

Latency: cold pipeline 25–40s end-to-end, dominated by image generation (4 inference steps × 2 parallel = 5–8s for the image step) and audio (8–15s for ElevenLabs depending on length). The Flux Schnell choice is deliberate — 4 inference steps not 50, because demo flow matters more than fine grain.

---

## 5. Honest limitations

- **No automated quality eval.** The translator's few-shots were tuned by reading 60-cell grids by hand. Next version needs LLM-as-judge or comparative human eval.
- **The deployed JS bundle is readable.** The translator system prompts are visible in DevTools. Acceptable for prospect demos, not for a productized version — those prompts would need to move server-side.
- **Audio doesn't survive page reload.** Blobs can't be serialized into sessionStorage, so a mid-flow reload regenerates audio (the only ElevenLabs cost on reload). Documented and accepted for now.
- **The hardcoded voice fallback is brittle.** ElevenLabs has been deprecating their original premade voice IDs; the runtime prefers the user's account voices and only falls back to hardcoded for visitors who haven't entered an ElevenLabs key.
- **Single-user only.** No multi-user, no team review, no audit log persisted beyond the session.

---

## 6. Next version — what I'd build

Concrete and in priority order:

1. **LLM-as-judge eval harness.** Replace the manual grid review with a rubric-driven scoring loop: feed the 60 cells through a stronger judge model, score each on adherence-to-direction, specificity, and brand-tone-fit. Run in CI on every translator system-prompt change to catch regressions.
2. **Server-side orchestration layer** behind a thin API, so the translator prompts (the actual IP) stop shipping to the client. Move keys server-side, add per-user auth, keep the same React shell.
3. **Brand dictionary** — a per-tenant config of banned terms, preferred terms, trademark renderings, voice character constraints. Threads through every step's system prompt automatically. Probably stored as a structured doc that gets injected into the system prompt envelope.
4. **Critique-as-judge for self-correction.** Currently critique is on-demand and human-driven. A toggleable "auto-critique" mode would have Claude critique each variant, and only surface the top-N by critique score. Risk: feedback loop drift. Worth experimenting with bounded iteration count.
5. **Streaming for the long calls.** ElevenLabs audio is the user-perceived bottleneck (~10s). Streaming the audio response would let playback start within ~2s. Image generation can't usefully stream but the script step can.
6. **Multi-modal brief input.** Drop a reference image into the brief and have it inform the image step's mood/palette. Probably via Claude's vision to extract a structured description that joins the translator's mod object.
7. **A/B export to ad platforms.** Push the two variants from any step directly to LINE Ads, Meta Ads, or Google Ads as a paired creative for A/B testing. Closes the loop from generation to measurement.
8. **Local-model fallback path.** Wire a local Llama or ELYZA endpoint as an alternate provider, mostly for the translator (which is bounded and structure-shaped, so a smaller model can handle it). Reduces cost and adds an air-gapped deployment story for enterprise.

---

## 7. Talking-points cheat sheet

If asked... | Lead with...
---|---
"What's the AI engineering you're proudest of?" | The direction translator. LLM-in-the-middle that converts unstructured user input into structured, asset-type-specific mods, decoupling user skill from output quality.
"What's the hardest bug you fixed?" | Cache invalidation across the 4-step state machine. The hash scoping rules took a written spec and 20+ tests.
"How do you handle prompt engineering?" | Few-shot examples in code (not in a UI), evaluated through a dev-only test harness, with structured-output schemas so the model can't drift on shape.
"How do you handle structured outputs?" | Two paths: OpenAI JSON-schema mode, Anthropic tool-use with forced tool_choice. Schema defined once as JSONSchema `as const`, Zod-validated on the way back.
"What about observability?" | Currently console-only — `humanize()` logs error codes and technical detail to console.debug. Production would need OpenTelemetry-style spans per provider call with cost/latency/tokens metadata.
"What would you do differently if starting over?" | Move the translator prompts server-side from day one — shipping them in the bundle is fine for demo, not for product.
"What's your favourite part of the codebase?" | `src/services/translator.ts` and the harness at `/?test=1`. Small surface, high-leverage IP, testable in isolation.

---

*Drafted as call prep — adjust details to match what feels honestly yours during the call.*
