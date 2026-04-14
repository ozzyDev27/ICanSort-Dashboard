import React, { useEffect, useRef, useState } from 'react'
import './App.css'
import { SCHEDULE, getActiveSlot, getNextSlot } from './schedule'

const CATEGORIES = ['Garbage', 'Recycling', 'Compost']
const CAT_COLOR  = { Garbage: '#a16207', Recycling: '#2563eb', Compost: '#16a34a' }
const CAT_ICON   = { Garbage: '🗑️', Recycling: '♻️', Compost: '🌱' }

const DEFAULT_MATRIX = {
  Garbage:   { Garbage: 246, Recycling:  27, Compost:  27 },
  Recycling: { Garbage:  30, Recycling: 228, Compost:  42 },
  Compost:   { Garbage:  24, Recycling:  45, Compost: 231 },
}

const DAILY_SESSIONS = [
  { date: '2026-04-07', grade: 'Grade 3', total: 148, correct: 120 },
  { date: '2026-04-07', grade: 'Grade 4', total: 155, correct: 128 },
  { date: '2026-04-07', grade: 'Grade 5', total: 143, correct: 115 },
  { date: '2026-04-08', grade: 'Grade 6', total: 152, correct: 124 },
  { date: '2026-04-08', grade: 'Grade 7', total: 160, correct: 133 },
  { date: '2026-04-08', grade: 'Grade 8', total: 142, correct: 114 },
  { date: '2026-04-09', grade: 'Grade 3', total: 151, correct: 123 },
  { date: '2026-04-09', grade: 'Grade 4', total: 148, correct: 120 },
  { date: '2026-04-14', grade: 'Grade 5', total: 162, correct: 136 },
  { date: '2026-04-14', grade: 'Grade 6', total: 155, correct: 126 },
  { date: '2026-04-14', grade: 'Grade 7', total: 158, correct: 130 },
  { date: '2026-04-14', grade: 'Grade 8', total: 146, correct: 116 },
]

const TOP_MISSORTED = [
  { item: 'Plastic bags',  actualBin: 'Garbage',   guessedBin: 'Recycling', count: 67, pct: 45 },
  { item: 'Soda cans',     actualBin: 'Recycling', guessedBin: 'Garbage',   count: 54, pct: 38 },
  { item: 'Banana peels',  actualBin: 'Compost',   guessedBin: 'Recycling', count: 41, pct: 31 },
  { item: 'Juice boxes',   actualBin: 'Recycling', guessedBin: 'Garbage',   count: 38, pct: 28 },
  { item: 'Coffee cups',   actualBin: 'Compost',   guessedBin: 'Garbage',   count: 29, pct: 25 },
]

function colTotal(m, col) {
  return CATEGORIES.reduce((s, r) => s + (m[r][col] ?? 0), 0)
}
function totalItems(m) {
  return CATEGORIES.reduce((s, r) => s + colTotal(m, r), 0)
}
function overallAccuracy(m) {
  const correct = CATEGORIES.reduce((s, c) => s + m[c][c], 0)
  const total   = totalItems(m)
  return total === 0 ? null : Math.round(correct / total * 100)
}
function pct(m, row, col) {
  const t = colTotal(m, col)
  return t === 0 ? null : Math.round(m[row][col] / t * 100)
}
function totalMissorted(m) {
  return CATEGORIES.reduce((s, col) =>
    s + CATEGORIES.reduce((ss, row) => row === col ? ss : ss + (m[row][col] ?? 0), 0), 0)
}
function divertedFromLandfill(m) {
  return (m['Recycling']?.['Recycling'] ?? 0) + (m['Compost']?.['Compost'] ?? 0)
}
function fmt12(t) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`
}
function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}
function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(id)
  }, [])
  return now
}

function MatrixView({ matrix }) {
  return (
    <div className="mx">
      {/* Header row */}
      <div className="mx-origin"><span className="mx-axis"></span></div>
      {CATEGORIES.map(c => (
        <div key={c} className="mx-col-head">{CAT_ICON[c]}{c}</div>
      ))}
      {CATEGORIES.flatMap((row, ri) => [
        <div key={`h-${row}`} className="mx-row-head">
          {ri === 1 && <span className="mx-axis" style={{ display: 'block', marginBottom: 3 }}>Guessed ↓</span>}
          <span>{CAT_ICON[row]} {row}</span>
        </div>,
        ...CATEGORIES.map(col => {
          const v = pct(matrix, row, col)
          return (
            <div
              key={`${row}-${col}`}
              className={`mx-cell ${row === col ? 'mx-correct' : 'mx-wrong'}`}
              style={{ '--v': (v ?? 0) / 100 }}
            >
              <span className="mx-pct">{v == null ? '—' : `${v}%`}</span>
              <span className="mx-count">{matrix[row][col]}</span>
            </div>
          )
        }),
      ])}
    </div>
  )
}

function DailyView({ sessions }) {
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
  return (
    <div className="daily-wrap">
      {dates.map(date => {
        const rows     = sessions.filter(s => s.date === date)
        const dayTotal = rows.reduce((s, r) => s + r.total, 0)
        const dayMiss  = rows.reduce((s, r) => s + (r.total - r.correct), 0)
        return (
          <div key={date} className="daily-block">
            <div className="daily-date">{fmtDate(date)}</div>
            <table className="daily-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Items</th>
                  <th>Missorted</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(s => {
                  const miss = s.total - s.correct
                  const acc  = Math.round(s.correct / s.total * 100)
                  return (
                    <tr key={s.grade}>
                      <td className="dt-grade">{s.grade}</td>
                      <td>{s.total}</td>
                      <td className="dt-miss">{miss}</td>
                      <td className="dt-acc">{acc}%</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="dt-grade dt-total">Day total</td>
                  <td className="dt-total">{dayTotal}</td>
                  <td className="dt-miss dt-total">{dayMiss}</td>
                  <td className="dt-acc dt-total">{Math.round((dayTotal - dayMiss) / dayTotal * 100)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function TopMissortedView({ items }) {
  return (
    <div className="topmiss-wrap">
      {items.map((item, i) => (
        <div key={item.item} className="topmiss-row">
          <span className="tm-rank">#{i + 1}</span>
          <div className="tm-info">
            <span className="tm-name">{item.item}</span>
            <span className="tm-detail">
              sorted as{' '}
              <span style={{ color: CAT_COLOR[item.guessedBin] }}>
                {CAT_ICON[item.guessedBin]} {item.guessedBin}
              </span>
              {' · '}should be{' '}
              <span style={{ color: CAT_COLOR[item.actualBin] }}>
                {CAT_ICON[item.actualBin]} {item.actualBin}
              </span>
            </span>
          </div>
          <div className="tm-bar-track">
            <div className="tm-bar-fill" style={{ width: `${item.pct}%`, background: CAT_COLOR[item.guessedBin] }} />
          </div>
          <span className="tm-pct">{item.pct}%</span>
        </div>
      ))}
    </div>
  )
}

/* ── AI chat helpers ─────────────────────────────────── */
function buildDataContext() {
  const t   = totalItems(MATRIX)
  const mis = totalMissorted(MATRIX)
  const acc = overallAccuracy(MATRIX)
  const div = divertedFromLandfill(MATRIX)
  return [
    `School waste-sorting dashboard. ${t} total items sorted across 6 grades.`,
    `Overall accuracy: ${acc}%. Missorted: ${mis} items (${Math.round(mis/t*100)}%).`,
    `Diverted from landfill (correct recycling+compost): ${div} items (${Math.round(div/t*100)}%).`,
    `Category accuracy — Garbage: ${pct(MATRIX,'Garbage','Garbage')}%, Recycling: ${pct(MATRIX,'Recycling','Recycling')}%, Compost: ${pct(MATRIX,'Compost','Compost')}%.`,
    `Top missorted items: ${TOP_MISSORTED.map(i=>`${i.item} sorted as ${i.guessedBin} ${i.pct}% of the time`).join('; ')}.`,
    `Daily sessions cover Grades 3–8, April 7–14 2026.`,
  ].join(' ')
}

function localAnswer(raw) {
  const q = raw.toLowerCase()
  if (/confus|most often|missort|wrong|mistake|top/.test(q))
    return `The most confused items are: ${TOP_MISSORTED.slice(0,3).map(i=>`${i.item} (${i.pct}%, sorted as ${i.guessedBin})`).join(', ')}.`
  if (/class|grade|best|worst/.test(q)) {
    const best = DAILY_SESSIONS.reduce((a,s) => s.correct/s.total > a.correct/a.total ? s : a)
    return `${best.grade} had the best individual session at ${Math.round(best.correct/best.total*100)}% accuracy on ${best.date}.`
  }
  if (/landfill|divert/.test(q)) {
    const d = divertedFromLandfill(MATRIX)
    return `${d.toLocaleString()} items (${Math.round(d/totalItems(MATRIX)*100)}%) were correctly sorted into recycling or compost, keeping them out of the landfill.`
  }
  if (/recycl/.test(q))  return `Recycling accuracy is ${pct(MATRIX,'Recycling','Recycling')}%. The biggest errors are plastic bags (should be garbage) and soda cans (should be recycling).`
  if (/compost/.test(q)) return `Compost accuracy is ${pct(MATRIX,'Compost','Compost')}%. Banana peels and coffee cups are most often placed in the wrong bin.`
  if (/garbage|trash/.test(q)) return `Garbage accuracy is ${pct(MATRIX,'Garbage','Garbage')}%. Students handle this category best overall.`
  if (/focus|improve|tip|suggest|teach/.test(q)) return `Focus on recycling — it has the lowest accuracy. Plastic bags (not recyclable) and juice boxes are the main sources of confusion.`
  return `Overall accuracy is ${overallAccuracy(MATRIX)}%. Try asking: which items are most confused, which class sorts best, or how many items avoided the landfill.`
}

const SUGGESTED = [
  'What items are most often confused?',
  'Which class sorts best?',
  'How many items avoided the landfill?',
  'What should teachers focus on?',
]

function ChatPanel() {
  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState([{ role: 'assistant', content: 'Hi! Ask me anything about the sorting data, or try a suggestion below.' }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg) return
    setInput('')
    const history = [...msgs, { role: 'user', content: msg }]
    setMsgs(history)
    setLoading(true)
    const key = import.meta.env.VITE_OPENAI_KEY
    if (!key) {
      setMsgs([...history, { role: 'assistant', content: localAnswer(msg) }])
      setLoading(false)
      return
    }
    try {
      const res  = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are a concise assistant for a school waste-sorting dashboard. Answer in 2–3 sentences using only this data:\n${buildDataContext()}` },
            ...history,
          ],
          max_tokens: 200,
        }),
      })
      const data = await res.json()
      setMsgs([...history, { role: 'assistant', content: data.choices?.[0]?.message?.content ?? 'No response.' }])
    } catch {
      setMsgs([...history, { role: 'assistant', content: 'Network error — please try again.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <button className="chat-btn" onClick={() => setOpen(o => !o)} aria-label="Ask AI">
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">Ask about the data</div>
          <div className="chat-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg chat-${m.role}`}>{m.content}</div>
            ))}
            {loading && <div className="chat-msg chat-assistant chat-loading">···</div>}
            <div ref={bottomRef} />
          </div>
          {msgs.length === 1 && (
            <div className="chat-chips">
              {SUGGESTED.map(s => (
                <button key={s} className="chat-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}
          <form className="chat-form" onSubmit={e => { e.preventDefault(); send() }}>
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={loading}
              autoFocus
            />
            <button className="chat-send" type="submit" disabled={loading || !input.trim()}>↑</button>
          </form>
        </div>
      )}
    </>
  )
}

function App() {
  const [matrix]        = useState(DEFAULT_MATRIX)
  const [view, setView] = useState('matrix')
  const now             = useNow()

  const active   = getActiveSlot(now)
  const next     = getNextSlot(now)
  const acc      = overallAccuracy(matrix)
  const total    = totalItems(matrix)
  const missed   = totalMissorted(matrix)
  const missPct  = total > 0 ? Math.round(missed / total * 100) : null
  const diverted = divertedFromLandfill(matrix)
  const timeStr  = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="page">
      <header className="header">
        <span className="logo">ICanSort</span>
        <div className="header-right">
          <span className="clock">{timeStr}</span>
          {active
            ? <span className="badge badge-active">{active.grade} · now</span>
            : next
              ? <span className="badge badge-next">Next: {next.grade} at {fmt12(next.start)}</span>
              : <span className="badge badge-done">No more sessions today</span>
          }
        </div>
      </header>

      <main className="main">
        <section className="content">

          <div className="kpis">
            <div className="kpi">
              <span className="kpi-val kpi-green">{acc !== null ? `${acc}%` : '—'}</span>
              <span className="kpi-lbl">Accuracy</span>
            </div>
            <div className="kpi">
              <span className="kpi-val">{total.toLocaleString()}</span>
              <span className="kpi-lbl">Items sorted</span>
            </div>
            <div className="kpi">
              <span className="kpi-val kpi-red">
                {missed} <span className="kpi-sub">{missPct !== null ? `${missPct}%` : ''}</span>
              </span>
              <span className="kpi-lbl">Missorted</span>
            </div>
            <div className="kpi">
              <span className="kpi-val kpi-blue">{diverted.toLocaleString()}</span>
              <span className="kpi-lbl">Diverted from landfill</span>
            </div>
          </div>

          <div className="tabs">
            {[
              ['matrix',  'Confusion Matrix'],
              ['daily',   'Daily'],
              ['topmiss', 'Top Missorted'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`tab${view === id ? ' tab-active' : ''}`}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {view === 'matrix'  && <MatrixView      matrix={matrix} />}
          {view === 'daily'   && <DailyView        sessions={DAILY_SESSIONS} />}
          {view === 'topmiss' && <TopMissortedView items={TOP_MISSORTED} />}

        </section>
      </main>

      <ChatPanel />
    </div>
  )
}

export default App
