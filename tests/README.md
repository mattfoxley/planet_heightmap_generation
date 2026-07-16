# Tests

Plain Node assertion scripts (no framework — the repo has no build step). Part of the
`normalize-world-scale` change.

## Prerequisite: local `package.json`

The app modules under `js/` are ES modules with a `.js` extension. Node only treats `.js` as ESM when
the nearest `package.json` declares `"type": "module"`. **`package.json` is gitignored** (repo
convention — see `.gitignore`; the `tuning/*.mjs` suite has the same requirement), so create a local one:

```json
{ "private": true, "type": "module" }
```

## Running

Node ≥ 12.17 (unflagged ESM):

```bash
node tests/world-scale.test.mjs
node tests/guard-earth-radius.mjs
```

Node 12.16.x (ESM still experimental) — add the flag:

```bash
node --experimental-modules tests/world-scale.test.mjs
node --experimental-modules tests/guard-earth-radius.mjs
```

## What they cover

- **`world-scale.test.mjs`** — conversion helpers + mesh metrics + profile resolution (19 assertions).
  Confirms `averageEdgeKm` reproduces the legacy `(π·R)/√N` idiom at Earth radius.
- **`guard-earth-radius.mjs`** — ratchet guard: fails if a *new* direct `6371` appears outside the
  allowlist of known legacy sites (which shrinks as later phases migrate call sites; target = only
  `world-profiles.js`).

Deterministic-seed *generation* tests are deferred (need the worker/browser). Per the Phase-0 baseline
finding, they must assert **same-seed reproducibility**, not cross-seed uniqueness (seeds 42≡400 collide
at detail 600).
