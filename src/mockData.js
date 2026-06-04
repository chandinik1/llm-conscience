// Realistic mock LLM call generator

const MODELS = [
  'gpt-4o', 'gpt-4o', 'gpt-4o',
  'gpt-3.5-turbo',
  'claude-opus-4', 'claude-opus-4',
  'claude-sonnet-4',
  'claude-3-haiku',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]

const TASKS = [
  // ── Classification (should use haiku/mini) ───────────────────────────────
  {
    taskType: 'classification',
    prompt: 'What is the sentiment of the following review? Respond with positive, negative, or neutral.',
    taskHint: 'sentiment', sysTokens: 120, pTokens: 280, cTokens: 8,
  },
  {
    taskType: 'classification',
    prompt: 'Is this message spam? Answer yes or no only.',
    taskHint: 'classify', sysTokens: 80, pTokens: 140, cTokens: 4,
  },
  {
    taskType: 'classification',
    prompt: 'Classify the intent of this support ticket: billing, technical, or general.',
    taskHint: 'categorize', sysTokens: 210, pTokens: 320, cTokens: 18,
  },
  {
    taskType: 'classification',
    prompt: 'Label this customer message as complaint, inquiry, or compliment.',
    taskHint: 'label this', sysTokens: 175, pTokens: 260, cTokens: 10,
  },

  // ── Extraction (should use haiku) ────────────────────────────────────────
  {
    taskType: 'extraction',
    prompt: 'Extract the invoice number from this text. Return only the number.',
    taskHint: 'extract field', sysTokens: 95, pTokens: 190, cTokens: 12,
  },
  {
    taskType: 'extraction',
    prompt: 'Extract all dates mentioned in this contract. Return as a JSON array.',
    taskHint: 'extract the', sysTokens: 180, pTokens: 1400, cTokens: 45,
  },
  {
    taskType: 'extraction',
    prompt: 'Return only the JSON field "status" from this payload.',
    taskHint: 'extract field', sysTokens: 1600, pTokens: 2400, cTokens: 18,
  },

  // ── Reasoning / Analysis (frontier justified) ────────────────────────────
  {
    taskType: 'reasoning',
    prompt: "Analyze the earnings call transcript and evaluate the CFO's forward guidance against macro indicators.",
    taskHint: 'analyze evaluate', sysTokens: 400, pTokens: 3800, cTokens: 820,
  },
  {
    taskType: 'reasoning',
    prompt: 'Compare the pros and cons of each architectural approach and recommend one for our scale.',
    taskHint: 'compare recommend', sysTokens: 380, pTokens: 2200, cTokens: 680,
  },
  {
    taskType: 'reasoning',
    prompt: 'Reason through the failure modes and deduce the root cause from these distributed system logs.',
    taskHint: 'reason deduce', sysTokens: 290, pTokens: 1850, cTokens: 540,
  },
  {
    taskType: 'reasoning',
    prompt: 'Weigh the regulatory trade-offs between GDPR compliance and data utility for this ML pipeline.',
    taskHint: 'weigh assess', sysTokens: 310, pTokens: 1600, cTokens: 490,
  },

  // ── Coding (sonnet is enough) ────────────────────────────────────────────
  {
    taskType: 'coding',
    prompt: 'Write a Python function that parses ISO 8601 timestamps with timezone handling.',
    taskHint: 'code', sysTokens: 120, pTokens: 85, cTokens: 320,
  },
  {
    taskType: 'coding',
    prompt: 'Refactor this React component to use hooks instead of class-based lifecycle methods.',
    taskHint: 'code refactor', sysTokens: 200, pTokens: 1100, cTokens: 980,
  },
  {
    taskType: 'coding',
    prompt: 'Write a SQL query that finds duplicate records across these three joined tables.',
    taskHint: 'code sql', sysTokens: 150, pTokens: 420, cTokens: 210,
  },
  {
    taskType: 'coding',
    prompt: 'Debug this Rust borrow checker error and explain what ownership rule is being violated.',
    taskHint: 'code debug', sysTokens: 180, pTokens: 680, cTokens: 350,
  },

  // ── Math (sonnet) ─────────────────────────────────────────────────────────
  {
    taskType: 'math',
    prompt: 'Solve this system of differential equations and verify the boundary conditions.',
    taskHint: 'math solve', sysTokens: 140, pTokens: 380, cTokens: 420,
  },
  {
    taskType: 'math',
    prompt: 'Calculate the confidence interval for this A/B test result with 95% significance.',
    taskHint: 'math calculate', sysTokens: 120, pTokens: 290, cTokens: 180,
  },

  // ── Summarization (flash) ────────────────────────────────────────────────
  {
    taskType: 'summarization',
    prompt: 'Summarize this document in three bullet points.',
    taskHint: 'summarize', sysTokens: 3200, pTokens: 1400, cTokens: 95,
  },
  {
    taskType: 'summarization',
    prompt: 'Draft a 3-sentence executive summary of the attached report.',
    taskHint: 'summarize', sysTokens: 160, pTokens: 1200, cTokens: 95,
  },
  {
    taskType: 'summarization',
    prompt: 'Condense this 50-page policy document into a one-page brief for the board.',
    taskHint: 'summarize', sysTokens: 240, pTokens: 4800, cTokens: 340,
  },

  // ── Translation (flash) ──────────────────────────────────────────────────
  {
    taskType: 'translation',
    prompt: 'Translate the following paragraph to German. Preserve formatting.',
    taskHint: 'translate', sysTokens: 180, pTokens: 3400, cTokens: 180,
  },
  {
    taskType: 'translation',
    prompt: 'Translate this legal clause to French and Spanish.',
    taskHint: 'translate', sysTokens: 140, pTokens: 620, cTokens: 310,
  },

  // ── Creative (sonnet) ────────────────────────────────────────────────────
  {
    taskType: 'creative',
    prompt: 'Write a compelling product description for this insurance policy in a human, warm tone.',
    taskHint: 'creative write', sysTokens: 200, pTokens: 480, cTokens: 390,
  },
  {
    taskType: 'creative',
    prompt: 'Rewrite this email in a more professional tone while keeping the key message.',
    taskHint: 'creative rewrite', sysTokens: 2900, pTokens: 1100, cTokens: 210,
  },

  // ── Q&A (gpt-4o-mini) ────────────────────────────────────────────────────
  {
    taskType: 'qa',
    prompt: 'What is the capital of France?',
    taskHint: 'factual', sysTokens: 1800, pTokens: 950, cTokens: 4,
  },
  {
    taskType: 'qa',
    prompt: 'Generate a one-word code name for this project.',
    taskHint: 'generate', sysTokens: 2100, pTokens: 1200, cTokens: 6,
  },
  {
    taskType: 'qa',
    prompt: 'What are the GDPR data retention requirements for financial records?',
    taskHint: 'factual qa', sysTokens: 300, pTokens: 180, cTokens: 140,
  },

  // ── Image (gpt-4o required) ──────────────────────────────────────────────
  {
    taskType: 'image',
    prompt: 'Describe what is in this document scan and extract the table data.',
    taskHint: 'image vision', sysTokens: 160, pTokens: 420, cTokens: 280,
  },
  {
    taskType: 'image',
    prompt: 'Does this photo show damage to the vehicle? Describe the damage for the insurance claim.',
    taskHint: 'image vision', sysTokens: 200, pTokens: 380, cTokens: 190,
  },
]

let _retryBurst = null
let _retryCount = 0

export function generateCall(now) {
  if (_retryBurst && _retryCount < 5 && Math.random() < 0.4) {
    _retryCount++
    const burst = _retryBurst
    if (_retryCount >= 5) _retryBurst = null
    return { ...burst, ts: now, id: crypto.randomUUID() }
  }

  const task  = TASKS[Math.floor(Math.random() * TASKS.length)]
  const model = MODELS[Math.floor(Math.random() * MODELS.length)]

  const jitter = n => Math.max(1, Math.round(n * (0.85 + Math.random() * 0.30)))

  const call = {
    id:                 crypto.randomUUID(),
    ts:                 now,
    model,
    taskType:           task.taskType,
    prompt:             task.prompt,
    taskHint:           task.taskHint,
    systemPromptTokens: jitter(task.sysTokens),
    promptTokens:       jitter(task.pTokens),
    completionTokens:   jitter(task.cTokens),
    retryCount:         0,
    app:                pickApp(),
    env:                Math.random() < 0.7 ? 'prod' : 'staging',
  }

  if (Math.random() < 0.08) {
    _retryBurst = call
    _retryCount = 1
  }

  return call
}

function pickApp() {
  const apps = ['claims-ingestion', 'policy-copilot', 'doc-extractor', 'risk-scorer', 'chat-support', 'underwriting-assist']
  return apps[Math.floor(Math.random() * apps.length)]
}

export function generateBacklog(count = 120) {
  const now   = Date.now()
  const calls = []
  for (let i = count; i >= 1; i--) {
    const age = Math.pow(Math.random(), 1.6) * 24 * 60 * 60 * 1000
    calls.push(generateCall(now - Math.round(age)))
  }
  return calls.sort((a, b) => a.ts - b.ts)
}
