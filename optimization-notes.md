# Optimization notes

Concise record of attempted optimizations and why each was kept or reverted, so
the same experiment isn't repeated blindly.

## Anthropic prompt caching on batch copy generation — REVERTED

- **Date:** 2026-05-31
- **Tried in:** `274c284` — `perf(batch): add Anthropic prompt caching to batch copy generation`
- **Reverted in:** `6ffbbc1` — `revert: remove Anthropic prompt caching (274c284) — cache_read never fires in production`
- **What:** sent the batch-copy system prompt as a `cache_control: {type:'ephemeral'}` block
  (new `cacheSystem` flag in `anthropicClient.messagesJson`) and moved the constant-across-batch
  content (instructions + brand block + language directive + shared campaign brief) into that
  cached prefix, leaving only per-customer parts in the user message.
- **Expected:** ~50% reduction in batch COPY cost on a 100-customer batch (prefix read from cache
  at $0.30/M instead of $3/M for customers 2..N).
- **Actual (measured against the live Anthropic API):** **zero savings.**
  `cache_read_input_tokens` never exceeded 0; `cache_creation_input_tokens` was inconsistent
  (observed 0 / 0 / 1091 across identical-prefix calls). Net effect ≥ baseline, with a slight
  net-increase risk from the 1.25× cache-write premium when creation fired without any read.
- **Suspected cause:** `claude-sonnet-4-6` + `anthropic-version: 2023-06-01` (what the proxy
  sends) does not reliably engage prompt caching for ~1000-token prefixes. The prefix also sits
  right on the 1024-token Sonnet minimum (count_tokens ≈ 978; real generation ≈ 1090–1119), so
  it is marginal even before the no-read problem.
- **Conditions tested — `cache_read` stayed 0 in ALL of them:**
  - prefix expanded above 1024 (added ~144 tokens of universal copywriting principles)
  - with and without the `anthropic-beta: prompt-caching-2024-07-31` header
  - `cache_control` on system only, and on system + tools
  - sequential calls ~4s apart (to allow cache propagation)
- **Note:** copy *input* tokens are a small slice of total batch cost anyway (dominated by
  output tokens + per-image Flux / per-character TTS), so the upside was limited even in theory.

### Re-evaluate prompt caching IF:
- the batch copy **model changes** (a newer model may cache reliably), OR
- the proxy's **`anthropic-version` is updated**, OR
- the cacheable prefix grows **well past ~2000 tokens** (large brand dictionaries / many learned
  insights), where caching is more likely to engage and the savings are larger.
- Before re-adding it, reproduce with `scripts/archived/cache-test/measure-cache.mjs` and only ship
  if `cache_read > 0` is observed on calls 2..N.

## Skip Flux image generation for text/voice recipients — KEPT

- **In:** `c724c1e` — `perf(batch): skip Flux image gen for text-only recipients`
- **What:** in `generateAssetsForCustomer`, only `recommendedFormat` of `'image'`/`'video'`
  triggers the OpenAI image-prompt + Flux call; `'text'`/`'voice'` recipients skip both.
- **Status:** kept — deterministic, unit-tested, real per-recipient saving (an entire Flux call
  plus an OpenAI call avoided whenever no image is needed).
