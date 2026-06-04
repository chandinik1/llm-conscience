# CLAUDE.md — LLM Conscience

Context for Claude Code when working in this repo.

## What This Project Is

A rule-based, fully auditable LLM API waste detector. No LLM judges the calls — pure heuristics, deterministic scoring, zero black box. Built for regulated environments (insurance, finance, legal) where cost decisions need to be explainable and auditable.

Core thesis: 75% of LLM waste is catchable with simple rules. No model needed to judge a model.

## Stack

- **React 18** + **Vite 5** — frontend only, no backend
- **No UI library** — all styling is inline CSS / CSS-in-JS for portability
- **No charting library** — bars are pure CSS width percentages
- **Mock data only** — `src/mockData.js` simulates a real API call stream

## Key Files

| File | Purpose |
|------|---------|
| `src/rules.js` | Single source of truth for all rules, task types, cost table, recommended models |
| `src/mockData.js` | Call generator — 28 task templates, retry burst simulation, 10 task types |
| `src/App.jsx` | Entire UI — live feed, analytics panels, filter bar, stat cards |

## Rules Engine Contract

`evaluate(call)` is a pure function. Input: a call object. Output: same object + `flags[]`, `actualCost`, `savings`, `recommendedModel`.

Never make `evaluate()` stateful. Retry storm state is handled upstream by `attachRetryCount()`, which is also pure given a history array.

## Adding a Rule

1. Add to `RULES` in `rules.js` — id, name, description, severity, color, bg
2. Add detection logic inside `evaluate()` — one `if` block, push to `flags`
3. Nothing else changes — badges, analytics, and the rule reference panel auto-update

## Adding a Task Type

1. Add to `TASK_TYPES` — label, color, bg, emoji
2. Add to `TASK_RECOMMENDATIONS` — model, reason
3. Add the recommended model key to `OVERKILL_RELATIVE_TO` with the set of models that are overkill for it
4. Add mock tasks to `TASKS` in `mockData.js` using the new `taskType` key

## Cost Table

Prices are in `MODEL_COSTS` in `rules.js`. Update when provider pricing changes. All savings estimates depend on this — keep it accurate.

## What Not to Do

- Do not add a charting library — CSS bars are intentional (no bundle bloat, fully auditable)
- Do not make the rules engine call an LLM — that defeats the entire point
- Do not add a backend unless connecting to a real proxy — the app is intentionally frontend-only
- Do not use `React.StrictMode` — causes double-mount issues with the mock data module-level state (`_retryBurst`)

## Future: Real Proxy

When connecting to real API traffic, replace `src/mockData.js` with a WebSocket or SSE client. The call object schema is documented in `README.md`. The rules engine doesn't change.

## Dev Commands

```bash
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve dist/ → http://localhost:4173
```
