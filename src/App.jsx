import { useState, useEffect, useRef } from 'react'
import { evaluate, attachRetryCount, RULES, TASK_TYPES, TASK_RECOMMENDATIONS, calcCost } from './rules.js'
import { generateCall, generateBacklog } from './mockData.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = {
  cost:    n => n < 0.001 ? '<$0.001' : `$${n.toFixed(4)}`,
  bigCost: n => n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`,
  pct:     n => `${(n * 100).toFixed(1)}%`,
  ts:      ts => new Date(ts).toLocaleTimeString('en-GB', { hour12: false }),
  num:     n => n.toLocaleString(),
}

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ rule }) {
  const label = rule.id === 'MODEL_MISMATCH' && rule.recommendedModel
    ? `USE ${rule.recommendedModel.toUpperCase()}`
    : rule.name.toUpperCase()
  return (
    <span title={rule.id === 'MODEL_MISMATCH' ? rule.reason : rule.description} style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
      padding: '2px 6px', borderRadius: 4,
      color: rule.color, background: rule.bg,
      border: `1px solid ${rule.color}33`,
      whiteSpace: 'nowrap', cursor: 'default',
    }}>
      {label}
    </span>
  )
}

function TaskTypeBadge({ taskType }) {
  const t = TASK_TYPES[taskType]
  if (!t) return null
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
      padding: '2px 6px', borderRadius: 4,
      color: t.color, background: t.bg,
      border: `1px solid ${t.color}33`,
      whiteSpace: 'nowrap',
    }}>
      {t.emoji} {t.label.toUpperCase()}
    </span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function Stat({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#111827', border: '1px solid #1f2937',
      borderRadius: 10, padding: '14px 20px',
      display: 'flex', flexDirection: 'column', gap: 2,
      borderLeft: `3px solid ${accent ?? '#374151'}`,
    }}>
      <span style={{ color: '#6b7280', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: '#f9fafb', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ color: '#4b5563', fontSize: 11 }}>{sub}</span>}
    </div>
  )
}

// ─── Live Feed row ────────────────────────────────────────────────────────────

function FeedRow({ call, isNew }) {
  const totalInput = call.promptTokens + call.systemPromptTokens
  const isWaste    = call.flags.length > 0

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 120px 95px 1fr 88px 72px 1fr 70px',
      gap: '0 10px',
      alignItems: 'center',
      padding: '7px 14px',
      borderBottom: '1px solid #111827',
      background: isNew ? '#0a1f0a' : isWaste ? '#0d0d0d' : 'transparent',
      transition: 'background 0.8s ease',
      fontSize: 12,
    }}>
      {/* Time */}
      <span style={{ color: '#6b7280', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
        {fmt.ts(call.ts)}
      </span>

      {/* Model */}
      <div>
        <div style={{
          color: ['claude-opus-4','claude-opus-4-5','claude-3-opus','gpt-4','gpt-4o','gemini-ultra'].includes(call.model)
            ? '#fbbf24' : '#94a3b8',
          fontWeight: 600, fontSize: 11,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {call.model}
        </div>
        {call.recommendedModel && call.recommendedModel !== call.model && (
          <div style={{ color: '#34d399', fontSize: 9, marginTop: 1 }}>
            → {call.recommendedModel}
          </div>
        )}
      </div>

      {/* Task type */}
      <div><TaskTypeBadge taskType={call.taskType} /></div>

      {/* Prompt snippet */}
      <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
        {call.prompt}
      </span>

      {/* Tokens */}
      <span style={{ color: '#4b5563', fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontSize: 11 }}>
        <span style={{ color: '#6b7280' }}>{fmt.num(totalInput)}</span>
        <span style={{ color: '#374151' }}>/</span>
        <span style={{ color: '#6b7280' }}>{fmt.num(call.completionTokens)}</span>
      </span>

      {/* Cost */}
      <span style={{ color: '#6b7280', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
        {fmt.cost(call.actualCost)}
      </span>

      {/* Flags */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {call.flags.length === 0
          ? <span style={{ color: '#16a34a', fontSize: 10 }}>✓ clean</span>
          : call.flags.map((f, i) => <Badge key={i} rule={f} />)
        }
      </div>

      {/* Savings */}
      <span style={{
        textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 11,
        color: call.savings > 0 ? '#f87171' : '#374151',
      }}>
        {call.savings > 0 ? fmt.cost(call.savings) : '—'}
      </span>
    </div>
  )
}

// ─── Bar (CSS) ────────────────────────────────────────────────────────────────

function HBar({ label, count, max, color, sub }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ color: '#9ca3af', fontSize: 12 }}>{label}</span>
        <span style={{ color: '#6b7280', fontSize: 11 }}>{sub}</span>
      </div>
      <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function Analytics({ evaluated }) {
  // Rule breakdown
  const ruleStats = Object.values(RULES).map(rule => {
    const hits  = evaluated.filter(c => c.flags.some(f => f.id === rule.id))
    const waste = hits.reduce((s, c) => s + c.savings, 0)
    return { rule, count: hits.length, waste }
  }).sort((a, b) => b.count - a.count)
  const maxRuleCount = Math.max(...ruleStats.map(r => r.count), 1)

  // Task type breakdown
  const typeStats = Object.entries(TASK_TYPES).map(([key, meta]) => {
    const typeCalls = evaluated.filter(c => c.taskType === key)
    const waste     = typeCalls.reduce((s, c) => s + c.savings, 0)
    const flagged   = typeCalls.filter(c => c.flags.length > 0).length
    const rec       = TASK_RECOMMENDATIONS[key]
    return { key, meta, count: typeCalls.length, waste, flagged, rec }
  }).filter(t => t.count > 0).sort((a, b) => b.count - a.count)
  const maxTypeCount = Math.max(...typeStats.map(t => t.count), 1)

  // Model breakdown
  const modelMap = {}
  for (const c of evaluated) {
    modelMap[c.model] = modelMap[c.model] ?? { calls: 0, cost: 0, waste: 0 }
    modelMap[c.model].calls++
    modelMap[c.model].cost  += c.actualCost
    modelMap[c.model].waste += c.savings
  }
  const models = Object.entries(modelMap).sort((a, b) => b[1].cost - a[1].cost)
  const maxModelCost = Math.max(...models.map(m => m[1].cost), 1)

  // App waste
  const appMap = {}
  for (const c of evaluated) {
    if (!c.flags.length) continue
    appMap[c.app] = appMap[c.app] ?? { calls: 0, waste: 0 }
    appMap[c.app].calls++
    appMap[c.app].waste += c.savings
  }
  const apps = Object.entries(appMap).sort((a, b) => b[1].waste - a[1].waste)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

      {/* Task type breakdown */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
        <h3 style={hdr}>Task Types &amp; Recommended Models</h3>
        {typeStats.map(({ key, meta, count, waste, flagged, rec }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33`,
                }}>
                  {meta.emoji} {meta.label.toUpperCase()}
                </span>
                {rec && (
                  <span style={{ color: '#34d399', fontSize: 10 }}>→ {rec.model}</span>
                )}
              </div>
              <span style={{ color: '#6b7280', fontSize: 11 }}>
                {count} calls · <span style={{ color: '#f87171' }}>{fmt.bigCost(waste)} waste</span>
              </span>
            </div>
            <div style={{ height: 5, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(count / maxTypeCount) * 100}%`, height: '100%', background: meta.color, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            {rec && (
              <div style={{ color: '#4b5563', fontSize: 10, marginTop: 3 }}>{rec.reason}</div>
            )}
          </div>
        ))}
      </div>

      {/* Rule hits */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
        <h3 style={hdr}>Rule Hits</h3>
        {ruleStats.map(({ rule, count, waste }) => (
          <HBar key={rule.id} label={rule.name} count={count} max={maxRuleCount} color={rule.color}
            sub={`${count} · ${fmt.bigCost(waste)} waste`} />
        ))}
      </div>

      {/* Model spend */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
        <h3 style={hdr}>Spend by Model</h3>
        {models.map(([model, s]) => (
          <HBar key={model} label={model} count={s.cost} max={maxModelCost} color='#3b82f6'
            sub={`${fmt.bigCost(s.cost)} · ${fmt.bigCost(s.waste)} flagged`} />
        ))}
      </div>

      {/* App waste + rule legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
          <h3 style={hdr}>Waste by App / Service</h3>
          {apps.length === 0 && <span style={{ color: '#4b5563', fontSize: 12 }}>No waste yet.</span>}
          {apps.map(([app, s]) => (
            <div key={app} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1f2937' }}>
              <span style={{ color: '#d1d5db', fontSize: 12 }}>{app}</span>
              <span style={{ color: '#f87171', fontSize: 12, fontWeight: 600 }}>{fmt.bigCost(s.waste)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
          <h3 style={hdr}>Rule Reference</h3>
          {Object.values(RULES).map(rule => (
            <div key={rule.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: rule.color, flexShrink: 0 }} />
                <span style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 600 }}>{rule.name}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                  color: rule.color, background: rule.bg, border: `1px solid ${rule.color}33`,
                }}>
                  {rule.severity.toUpperCase()}
                </span>
              </div>
              <p style={{ color: '#6b7280', fontSize: 10, marginLeft: 13 }}>{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

const hdr = { color: '#f9fafb', fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }

// ─── App ──────────────────────────────────────────────────────────────────────

const MAX_FEED = 200
const TICK_MS  = 1400

export default function App() {
  const [calls, setCalls]   = useState([])
  const [tab, setTab]       = useState('feed')
  const [paused, setPaused] = useState(false)
  const [newIds, setNewIds] = useState(new Set())
  const [taskFilter, setTaskFilter] = useState('all')
  const feedRef    = useRef(null)
  const historyRef = useRef([])

  useEffect(() => {
    const backlog = generateBacklog(120).map(raw => {
      const withRetry = attachRetryCount(raw, historyRef.current)
      const ev = evaluate(withRetry)
      historyRef.current.push(ev)
      return ev
    })
    setCalls(backlog)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      const raw       = generateCall(Date.now())
      const withRetry = attachRetryCount(raw, historyRef.current)
      const ev        = evaluate(withRetry)
      historyRef.current = [...historyRef.current.slice(-500), ev]

      setCalls(prev => {
        const next = [...prev, ev]
        return next.length > MAX_FEED ? next.slice(next.length - MAX_FEED) : next
      })
      setNewIds(prev => {
        const next = new Set(prev)
        next.add(ev.id)
        setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(ev.id); return n }), 1500)
        return next
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [paused])

  useEffect(() => {
    if (tab === 'feed' && !paused && feedRef.current)
      feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [calls, tab, paused])

  const evaluated  = calls
  const wasteCount = evaluated.filter(c => c.flags.length > 0).length
  const wasteRate  = evaluated.length ? wasteCount / evaluated.length : 0
  const totalCost  = evaluated.reduce((s, c) => s + c.actualCost, 0)
  const totalWaste = evaluated.reduce((s, c) => s + c.savings, 0)

  const visibleCalls = taskFilter === 'all'
    ? evaluated
    : evaluated.filter(c => c.taskType === taskFilter)

  return (
    <div style={{ background: '#030712', minHeight: '100vh', color: '#e5e7eb', fontFamily: "'SF Mono','Fira Code',monospace" }}>

      {/* Header */}
      <div style={{
        background: '#0a0f1a', borderBottom: '1px solid #1f2937',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.02em' }}>
            LLM <span style={{ color: '#f87171' }}>Waste</span> Detector
          </span>
          <span style={{
            fontSize: 10, color: '#16a34a', background: '#052e16',
            border: '1px solid #16a34a44', padding: '2px 8px', borderRadius: 20,
            fontWeight: 700, letterSpacing: '0.08em',
          }}>
            {paused ? '⏸ PAUSED' : '● LIVE'}
          </span>
          <span style={{ fontSize: 10, color: '#4b5563' }}>rule-based · no LLM · fully auditable</span>
        </div>
        <button onClick={() => setPaused(p => !p)} style={{
          background: paused ? '#16a34a22' : '#1f293744',
          border: `1px solid ${paused ? '#16a34a' : '#374151'}`,
          color: paused ? '#16a34a' : '#9ca3af',
          padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          <Stat label="Total Calls"     value={fmt.num(evaluated.length)} sub="last 200 shown"          accent="#3b82f6" />
          <Stat label="Waste Rate"      value={fmt.pct(wasteRate)}         sub={`${wasteCount} flagged`}    accent="#f87171" />
          <Stat label="Est. Savings"    value={fmt.bigCost(totalWaste)}    sub="if task-matched"           accent="#fb923c" />
          <Stat label="Total Spend"     value={fmt.bigCost(totalCost)}     sub="this window"               accent="#a78bfa" />
          <Stat label="Clean Call Rate" value={fmt.pct(1 - wasteRate)}     sub="passed all rules"          accent="#16a34a" />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #1f2937' }}>
          {['feed', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 18px', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
              color: tab === t ? '#f9fafb' : '#4b5563',
              borderBottom: `2px solid ${tab === t ? '#3b82f6' : 'transparent'}`,
              textTransform: 'capitalize',
            }}>
              {t === 'feed' ? `Live Feed (${evaluated.length})` : 'Analytics'}
            </button>
          ))}
        </div>

        {/* Live Feed */}
        {tab === 'feed' && (
          <div style={{ background: '#0a0f1a', border: '1px solid #1f2937', borderRadius: 10, overflow: 'hidden' }}>

            {/* Task type filter */}
            <div style={{
              padding: '8px 14px', background: '#0d1117', borderBottom: '1px solid #1f2937',
              display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
            }}>
              <span style={{ color: '#4b5563', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4 }}>Filter</span>
              {['all', ...Object.keys(TASK_TYPES)].map(key => {
                const t    = TASK_TYPES[key]
                const active = taskFilter === key
                return (
                  <button key={key} onClick={() => setTaskFilter(key)} style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                    color:       active ? (t?.color ?? '#f9fafb') : '#4b5563',
                    background:  active ? (t?.bg    ?? '#1f2937') : 'transparent',
                    border:      `1px solid ${active ? (t?.color ?? '#6b7280') + '66' : '#1f2937'}`,
                  }}>
                    {t ? `${t.emoji} ${t.label}` : 'ALL'}
                  </button>
                )
              })}
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 120px 95px 1fr 88px 72px 1fr 70px',
              gap: '0 10px',
              padding: '6px 14px',
              background: '#111827', borderBottom: '1px solid #1f2937',
              fontSize: 10, color: '#4b5563', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              <span>Time</span><span>Model</span><span>Type</span><span>Prompt</span>
              <span style={{ textAlign: 'right' }}>In/Out</span>
              <span style={{ textAlign: 'right' }}>Cost</span>
              <span style={{ textAlign: 'right' }}>Flags</span>
              <span style={{ textAlign: 'right' }}>Savings</span>
            </div>

            <div ref={feedRef} style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {visibleCalls.map(call => (
                <FeedRow key={call.id} call={call} isNew={newIds.has(call.id)} />
              ))}
            </div>
          </div>
        )}

        {tab === 'analytics' && <Analytics evaluated={evaluated} />}
      </div>
    </div>
  )
}
