// ─── Rule definitions ────────────────────────────────────────────────────────

export const RULES = {
  PROMPT_BLOAT: {
    id: 'PROMPT_BLOAT',
    name: 'Prompt Bloat',
    description: 'Total input >3k tokens with no reasoning keywords',
    severity: 'medium',
    color: '#f59e0b',
    bg: '#451a03',
  },
  MODEL_OVERKILL: {
    id: 'MODEL_OVERKILL',
    name: 'Model Overkill',
    description: 'Frontier model used; no analysis/reasoning in prompt',
    severity: 'high',
    color: '#f87171',
    bg: '#450a0a',
  },
  RETRY_STORM: {
    id: 'RETRY_STORM',
    name: 'Retry Storm',
    description: 'Same prompt (±10% tokens) fired 3+ times in 60 s',
    severity: 'critical',
    color: '#fb923c',
    bg: '#431407',
  },
  BLOATED_SYSTEM_PROMPT: {
    id: 'BLOATED_SYSTEM_PROMPT',
    name: 'Bloated System Prompt',
    description: 'System prompt >50% of total input tokens',
    severity: 'medium',
    color: '#a78bfa',
    bg: '#2e1065',
  },
  LOW_OUTPUT_RATIO: {
    id: 'LOW_OUTPUT_RATIO',
    name: 'Low Output Ratio',
    description: 'Completion <5% of input — probably over-contexted',
    severity: 'low',
    color: '#67e8f9',
    bg: '#083344',
  },
  CLASSIFICATION_OVERKILL: {
    id: 'CLASSIFICATION_OVERKILL',
    name: 'Classification Overkill',
    description: 'Sentiment / yes-no / extract task on a frontier model',
    severity: 'high',
    color: '#f87171',
    bg: '#450a0a',
  },
  MODEL_MISMATCH: {
    id: 'MODEL_MISMATCH',
    name: 'Model Mismatch',
    description: 'A cheaper model is known to handle this task type well',
    severity: 'high',
    color: '#34d399',
    bg: '#022c22',
  },
}

// ─── Task types ───────────────────────────────────────────────────────────────

export const TASK_TYPES = {
  coding:         { label: 'Coding',         color: '#60a5fa', bg: '#1e3a5f', emoji: '</>' },
  math:           { label: 'Math',           color: '#c084fc', bg: '#3b0764', emoji: '∑'  },
  reasoning:      { label: 'Reasoning',      color: '#fbbf24', bg: '#451a03', emoji: '⟳'  },
  classification: { label: 'Classification', color: '#f87171', bg: '#450a0a', emoji: '⊞'  },
  extraction:     { label: 'Extraction',     color: '#fb923c', bg: '#431407', emoji: '⊡'  },
  summarization:  { label: 'Summarization',  color: '#a3e635', bg: '#1a2e05', emoji: '≡'  },
  creative:       { label: 'Creative',       color: '#f472b6', bg: '#500724', emoji: '✦'  },
  qa:             { label: 'Q&A',            color: '#67e8f9', bg: '#083344', emoji: '?'  },
  translation:    { label: 'Translation',    color: '#4ade80', bg: '#052e16', emoji: '⇄'  },
  image:          { label: 'Image',          color: '#e879f9', bg: '#4a044e', emoji: '⬜' },
}

// ─── Task type → recommended model ───────────────────────────────────────────
// recommended: cheapest model known to handle this task well
// frontier_ok: true = frontier justified; false = overkill

export const TASK_RECOMMENDATIONS = {
  coding:         { model: 'claude-sonnet-4',   reason: 'Sonnet handles code at ⅕ the cost of Opus'           },
  math:           { model: 'claude-sonnet-4',   reason: 'Sonnet-4 matches Opus on most math benchmarks'        },
  reasoning:      { model: 'claude-sonnet-4',   reason: 'Sonnet-4 matches Opus on reasoning; Opus for hardest' },
  classification: { model: 'claude-3-haiku',    reason: 'Haiku/mini is purpose-built for yes-no & labels'      },
  extraction:     { model: 'claude-3-haiku',    reason: 'Structured extraction needs speed, not intelligence'   },
  summarization:  { model: 'gemini-1.5-flash',  reason: 'Flash has 1M context, built for summarisation'        },
  creative:       { model: 'claude-sonnet-4',   reason: 'Creative quality equivalent to Opus at 5× less cost'  },
  qa:             { model: 'gpt-4o-mini',       reason: 'Factual Q&A is well-solved by mini-tier models'       },
  translation:    { model: 'gemini-1.5-flash',  reason: 'Translation is solved at flash tier'                  },
  image:          { model: 'gpt-4o',            reason: 'Vision task requires a multimodal model (gpt-4o min)' },
}

// Models that are considered overkill relative to a task's recommended tier
const OVERKILL_RELATIVE_TO = {
  'claude-3-haiku':   new Set(['claude-opus-4', 'claude-opus-4-5', 'claude-3-opus', 'gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gemini-ultra', 'gemini-1.5-pro', 'claude-sonnet-4']),
  'gpt-4o-mini':      new Set(['gpt-4o', 'gpt-4', 'gpt-4-turbo', 'claude-opus-4', 'claude-opus-4-5', 'claude-3-opus', 'gemini-ultra', 'gemini-1.5-pro', 'claude-sonnet-4']),
  'gemini-1.5-flash': new Set(['gpt-4o', 'gpt-4', 'gpt-4-turbo', 'claude-opus-4', 'claude-opus-4-5', 'claude-3-opus', 'gemini-ultra', 'gemini-1.5-pro', 'claude-sonnet-4']),
  'claude-sonnet-4':  new Set(['claude-opus-4', 'claude-opus-4-5', 'claude-3-opus', 'gemini-ultra']),
  'gpt-4o':           new Set([]),  // gpt-4o is the floor for image tasks
}

// ─── Keyword lists ────────────────────────────────────────────────────────────

const REASONING_KW = [
  'analyze', 'analyse', 'reason', 'compare', 'evaluate', 'synthesize',
  'explain why', 'pros and cons', 'pros/cons', 'recommend', 'strategy',
  'plan', 'decision', 'trade-off', 'tradeoff', 'assess', 'critique',
  'infer', 'deduce', 'weigh',
]

const CLASSIFICATION_KW = [
  'sentiment', 'classify', 'categorize', 'categorise', 'yes or no',
  'true or false', 'extract field', 'extract the', 'is this', 'label this',
  'tag this', 'positive or negative', 'intent of', 'which category',
]

const FRONTIER_MODELS = new Set([
  'gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-4-turbo',
  'claude-3-opus', 'claude-opus-4', 'claude-opus-4-5',
  'gemini-ultra', 'gemini-1.5-pro',
])

// ─── Per-call cost table (USD per 1k tokens) ─────────────────────────────────

export const MODEL_COSTS = {
  'gpt-4o':            { input: 0.005,    output: 0.015   },
  'gpt-4o-mini':       { input: 0.00015,  output: 0.0006  },
  'gpt-4':             { input: 0.03,     output: 0.06    },
  'gpt-4-turbo':       { input: 0.01,     output: 0.03    },
  'gpt-3.5-turbo':     { input: 0.0005,   output: 0.0015  },
  'claude-opus-4':     { input: 0.015,    output: 0.075   },
  'claude-opus-4-5':   { input: 0.015,    output: 0.075   },
  'claude-3-opus':     { input: 0.015,    output: 0.075   },
  'claude-sonnet-4':   { input: 0.003,    output: 0.015   },
  'claude-3-haiku':    { input: 0.00025,  output: 0.00125 },
  'gemini-ultra':      { input: 0.0125,   output: 0.0375  },
  'gemini-1.5-pro':    { input: 0.00125,  output: 0.005   },
  'gemini-1.5-flash':  { input: 0.000075, output: 0.0003  },
}

export function calcCost(call) {
  const rates = MODEL_COSTS[call.model] ?? { input: 0.002, output: 0.004 }
  const inputTokens = call.promptTokens + call.systemPromptTokens
  return (inputTokens / 1000) * rates.input + (call.completionTokens / 1000) * rates.output
}

// ─── Main evaluator ───────────────────────────────────────────────────────────

export function evaluate(call) {
  const flags      = []
  const totalInput = call.promptTokens + call.systemPromptTokens
  const isFrontier = FRONTIER_MODELS.has(call.model)
  const lower      = (call.prompt + ' ' + (call.taskHint ?? '')).toLowerCase()
  const hasReasoning      = REASONING_KW.some(kw => lower.includes(kw))
  const hasClassification = CLASSIFICATION_KW.some(kw => lower.includes(kw))

  // R1 – Prompt Bloat
  if (totalInput > 3000 && !hasReasoning)
    flags.push(RULES.PROMPT_BLOAT)

  // R2 – Model Overkill (generic)
  if (isFrontier && !hasReasoning && !hasClassification)
    flags.push(RULES.MODEL_OVERKILL)

  // R3 – Retry Storm
  if (call.retryCount >= 3)
    flags.push(RULES.RETRY_STORM)

  // R4 – Bloated System Prompt
  if (call.systemPromptTokens > 0 && call.systemPromptTokens / totalInput > 0.5)
    flags.push(RULES.BLOATED_SYSTEM_PROMPT)

  // R5 – Low Output Ratio
  if (totalInput > 500 && call.completionTokens / totalInput < 0.05)
    flags.push(RULES.LOW_OUTPUT_RATIO)

  // R6 – Classification Overkill
  if (isFrontier && hasClassification)
    flags.push(RULES.CLASSIFICATION_OVERKILL)

  // R7 – Model Mismatch (task-type based)
  const rec = call.taskType ? TASK_RECOMMENDATIONS[call.taskType] : null
  if (rec) {
    const overkillSet = OVERKILL_RELATIVE_TO[rec.model] ?? new Set()
    if (overkillSet.has(call.model)) {
      flags.push({ ...RULES.MODEL_MISMATCH, recommendedModel: rec.model, reason: rec.reason })
    }
  }

  // Savings: cost diff vs. task-recommended model (or cheapest fallback)
  const actualCost   = calcCost(call)
  const targetModel  = rec?.model ?? (hasClassification ? 'claude-3-haiku' : 'gpt-4o-mini')
  const targetCost   = calcCost({ ...call, model: targetModel })
  const savings      = flags.length > 0 ? Math.max(0, actualCost - targetCost) : 0
  const recommendedModel = rec?.model ?? null

  return { ...call, flags, actualCost, savings, recommendedModel }
}

// ─── History-based retry-storm tracker ───────────────────────────────────────

const WINDOW_MS = 60_000

export function attachRetryCount(newCall, history) {
  const windowStart = newCall.ts - WINDOW_MS
  const recent = history.filter(c => c.ts >= windowStart)
  const count = recent.filter(c => {
    const ratio = Math.abs(c.promptTokens - newCall.promptTokens) / (newCall.promptTokens || 1)
    return ratio <= 0.1 && c.model === newCall.model
  }).length
  return { ...newCall, retryCount: count }
}
