# llm-conscience

> Most orgs discover their LLM bill at the end of the month. llm-conscience tells you mid-call.

A rule-based, fully auditable dashboard for detecting wasteful LLM API usage. No model judges the calls — pure heuristics, deterministic scoring, zero black box. Built for regulated environments where cost decisions need to be explainable.

![llm-conscience live feed](demo.gif)

Built with [Claude Code](https://claude.ai/code).

---

## The problem

Every token costs money. But in most engineering orgs, the people writing the prompts never see the bill — and the people seeing the bill can't read the prompts. There's no feedback loop. GPT-4o gets used for sentiment classification. Retry storms run undetected for days. System prompts balloon to 3k tokens and get resent on every call.

llm-conscience is the missing layer: a conscience that sits between your code and the API, watches every call, and tells you exactly what's wasteful and why.

---

## How it works

Every intercepted call runs through 7 deterministic rules. No LLM involved — just keyword detection, token ratios, and call history. Each flagged call gets an estimated saving: the difference between what it actually cost and what it would have cost on the right model.

| # | Rule | Trigger | Severity |
|---|------|---------|----------|
| R1 | Prompt bloat | Input > 3k tokens, no reasoning keywords | Medium |
| R2 | Model overkill | Frontier model, no analysis/reasoning in prompt | High |
| R3 | Retry storm | Same prompt (±10% tokens) fired 3+ times in 60s | Critical |
| R4 | Bloated system prompt | System prompt > 50% of total input tokens | Medium |
| R5 | Low output ratio | Completion tokens < 5% of input tokens | Low |
| R6 | Classification overkill | Sentiment/yes-no/extract task on a frontier model | High |
| R7 | Model mismatch | A cheaper model is known to handle this task type well | High |

All logic lives in `src/rules.js`. Each rule is a pure function — given a call object, returns flags. No state, no ML, fully testable.

---

## Task-aware model recommendations

When a call is flagged, llm-conscience doesn't just complain — it tells you what model to use instead and why.

| Task type | Recommended model | Reason |
|-----------|------------------|--------|
| `coding` | `claude-sonnet-4` | Matches Opus quality at ⅕ the cost |
| `classification` | `claude-3-haiku` | Purpose-built for yes/no and labels |
| `extraction` | `claude-3-haiku` | Structured extraction needs speed, not intelligence |
| `summarization` | `gemini-1.5-flash` | 1M context window, built for this |
| `translation` | `gemini-1.5-flash` | Solved at flash tier |
| `qa` | `gpt-4o-mini` | Factual Q&A is well-handled by mini models |
| `reasoning` | `claude-sonnet-4` | Sonnet-4 matches Opus on most reasoning benchmarks |
| `creative` | `claude-sonnet-4` | Equivalent quality to Opus at 5× less cost |
| `image` | `gpt-4o` | Vision requires multimodal minimum |

---

## Dashboard

### Live feed tab

Streams calls in real time. Each row shows model used, task type, token counts, actual cost, triggered rules, and estimated saving if the right model had been used. Frontier models flagged in amber. Filter by task type.

### Analytics tab

- Rule hits — how often each rule fires and total waste attributed
- Spend by model — actual vs flagged cost per model
- Task type breakdown — call volume and waste per task type with recommended model
- Waste by service — which internal services are generating the most waste

---

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The dashboard runs on simulated call data out of the box.

```bash
npm run build && npm run preview  # production build
```

---

## Connecting to a real proxy

The mock data layer (`src/mockData.js`) is the only part that needs replacing for production. The rest of the pipeline is data-agnostic.

Recommended approach — a FastAPI proxy that:
1. Intercepts all LLM API calls from your services
2. Logs each request/response with token counts
3. Streams events to this dashboard via SSE or WebSocket
4. Runs the same rule logic server-side (port `rules.js` to Python or call via Node sidecar)

Each real call maps directly to the call object schema in `src/rules.js`.

---

## Extending

**Add a rule:** add an entry to `RULES` in `rules.js` and detection logic inside `evaluate()`. The badge and analytics panels pick it up automatically.

**Add a task type:** add entries to `TASK_TYPES`, `TASK_RECOMMENDATIONS`, and `OVERKILL_RELATIVE_TO`. Use the new key in mock or real call data.

**Change tick speed:**
```js
// App.jsx
const TICK_MS = 1400  // ms between simulated calls
```

---

## Cost table

Prices used for savings estimates (USD per 1k tokens):

| Model | Input | Output |
|-------|-------|--------|
| `gpt-4o` | $0.0050 | $0.0150 |
| `gpt-4o-mini` | $0.00015 | $0.0006 |
| `gpt-4-turbo` | $0.0100 | $0.0300 |
| `claude-opus-4` | $0.0150 | $0.0750 |
| `claude-sonnet-4` | $0.0030 | $0.0150 |
| `claude-3-haiku` | $0.00025 | $0.00125 |
| `gemini-1.5-pro` | $0.00125 | $0.0050 |
| `gemini-1.5-flash` | $0.000075 | $0.0003 |

---

## Project structure

```
llm-conscience/
├── src/
│   ├── rules.js      # Rules engine, cost table, task type map, savings calc
│   ├── mockData.js   # Mock call generator — 28 task templates, retry burst sim
│   ├── App.jsx       # Dashboard UI — live feed, analytics, filter bar
│   ├── main.jsx      # React entry point
│   └── index.css     # Base reset + scrollbar styling
├── index.html
├── vite.config.js
└── package.json
```

---

MIT license
