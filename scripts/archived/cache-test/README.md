# Archived: prompt-caching experiment

This directory preserves the verification artifacts for the **reverted** Anthropic
prompt-caching optimization (commit `274c284`, reverted in `6ffbbc1`). It is **not**
part of the app build or test suite.

- `measure-cache.mjs` — reproduces the live measurement (prints `cache_creation` /
  `cache_read`). Use it to decide whether caching is worth re-introducing — only ship
  the mechanism if `cache_read > 0` appears on calls 2..N. Has env knobs (`MODEL`,
  `ANTHROPIC_VERSION`, `BETA=1`, `CALLS`).
- `anthropicClient.cache-injection.test.ts.txt` — the unit test that was removed by the
  revert (saved as `.txt` so the runner ignores it), kept for reference on how the
  `cache_control` injection was asserted.

Full rationale + re-evaluation conditions: `../../../optimization-notes.md`.
