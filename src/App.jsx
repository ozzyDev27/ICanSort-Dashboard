import React, { useEffect, useRef, useState } from 'react'
import './App.css'

/* ── Default schedule (editable via UI) ─────────── */
const CLASSES_DEFAULT = [
  { id: 1, name: "Ms. Smith's Class",  grade: 'Grade 3', start: '08:30', end: '09:15' },
  { id: 2, name: "Mr. Jones' Class",   grade: 'Grade 4', start: '09:15', end: '10:00' },
  { id: 3, name: "Ms. Brown's Class",  grade: 'Grade 5', start: '10:15', end: '11:00' },
  { id: 4, name: "Mr. Davis' Class",   grade: 'Grade 6', start: '11:00', end: '11:45' },
  { id: 5, name: "Ms. Gigg's Class",   grade: 'Grade 7', start: '12:30', end: '13:15' },
  { id: 6, name: "Mr. Wilson's Class", grade: 'Grade 8', start: '13:15', end: '14:00' },
]

const GRADES = ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8']

function toMins(t) { const [h,m] = t.split(':').map(Number); return h*60+m }
function getActiveSlot(sched, now) {
  const cur = now.getHours()*60+now.getMinutes()
  return sched.find(s => cur >= toMins(s.start) && cur < toMins(s.end)) ?? null
}
function getNextSlot(sched, now) {
  const cur = now.getHours()*60+now.getMinutes()
  return [...sched].sort((a,b)=>toMins(a.start)-toMins(b.start)).find(s => toMins(s.start) > cur) ?? null
}

const CATEGORIES = ['Garbage', 'Recycling', 'Compost']
const CAT_COLOR  = { Garbage: 'var(--cat-garbage)', Recycling: 'var(--cat-recycling)', Compost: 'var(--cat-compost)' }
const CAT_ICON   = { Garbage: '🗑️', Recycling: '♻️', Compost: '🌱' }

const MATRIX = {
  Garbage:   { Garbage: 246, Recycling:  27, Compost:  27 },
  Recycling: { Garbage:  30, Recycling: 228, Compost:  42 },
  Compost:   { Garbage:  24, Recycling:  45, Compost: 231 },
}

const DAILY_SESSIONS = [
  { date: '2026-04-07', name: "Ms. Smith's Class",  grade: 'Grade 3', total:  87, correct:  71 },
  { date: '2026-04-07', name: "Mr. Jones' Class",   grade: 'Grade 4', total:  93, correct:  78 },
  { date: '2026-04-07', name: "Ms. Brown's Class",  grade: 'Grade 5', total:  89, correct:  74 },
  { date: '2026-04-07', name: "Mr. Davis' Class",   grade: 'Grade 6', total:  91, correct:  73 },
  { date: '2026-04-07', name: "Ms. Gigg's Class",   grade: 'Grade 7', total:  88, correct:  76 },
  { date: '2026-04-07', name: "Mr. Wilson's Class", grade: 'Grade 8', total:  84, correct:  67 },
  { date: '2026-04-08', name: "Ms. Smith's Class",  grade: 'Grade 3', total:  91, correct:  73 },
  { date: '2026-04-08', name: "Mr. Jones' Class",   grade: 'Grade 4', total:  86, correct:  71 },
  { date: '2026-04-08', name: "Ms. Brown's Class",  grade: 'Grade 5', total:  94, correct:  79 },
  { date: '2026-04-08', name: "Mr. Davis' Class",   grade: 'Grade 6', total:  83, correct:  66 },
  { date: '2026-04-08', name: "Ms. Gigg's Class",   grade: 'Grade 7', total:  92, correct:  81 },
  { date: '2026-04-08', name: "Mr. Wilson's Class", grade: 'Grade 8', total:  88, correct:  69 },
  { date: '2026-04-09', name: "Ms. Smith's Class",  grade: 'Grade 3', total:  85, correct:  68 },
  { date: '2026-04-09', name: "Mr. Jones' Class",   grade: 'Grade 4', total:  90, correct:  76 },
  { date: '2026-04-09', name: "Ms. Brown's Class",  grade: 'Grade 5', total:  88, correct:  72 },
  { date: '2026-04-09', name: "Mr. Davis' Class",   grade: 'Grade 6', total:  93, correct:  77 },
  { date: '2026-04-09', name: "Ms. Gigg's Class",   grade: 'Grade 7', total:  87, correct:  74 },
  { date: '2026-04-09', name: "Mr. Wilson's Class", grade: 'Grade 8', total:  89, correct:  71 },
  { date: '2026-04-14', name: "Ms. Smith's Class",  grade: 'Grade 3', total:  92, correct:  77 },
  { date: '2026-04-14', name: "Mr. Jones' Class",   grade: 'Grade 4', total:  84, correct:  69 },
  { date: '2026-04-14', name: "Ms. Brown's Class",  grade: 'Grade 5', total:  91, correct:  78 },
  { date: '2026-04-14', name: "Mr. Davis' Class",   grade: 'Grade 6', total:  88, correct:  71 },
  { date: '2026-04-14', name: "Ms. Gigg's Class",   grade: 'Grade 7', total:  86, correct:  73 },
  { date: '2026-04-14', name: "Mr. Wilson's Class", grade: 'Grade 8', total:  91, correct:  74 },
]

const TOP_MISSORTED = [
  { item: 'Plastic bags',  actual: 'Garbage',   guessed: 'Recycling', pct: 45 },
  { item: 'Soda cans',     actual: 'Recycling', guessed: 'Garbage',   pct: 38 },
  { item: 'Banana peels',  actual: 'Compost',   guessed: 'Recycling', pct: 31 },
  { item: 'Juice boxes',   actual: 'Recycling', guessed: 'Garbage',   pct: 28 },
  { item: 'Coffee cups',   actual: 'Compost',   guessed: 'Garbage',   pct: 25 },
]

/* ── Math helpers ────────────────────────────────── */
const colTotal        = (m, col) => CATEGORIES.reduce((s, r) => s + (m[r][col] ?? 0), 0)
const totalItems      = m => CATEGORIES.reduce((s, r) => s + colTotal(m, r), 0)
const pct             = (m, row, col) => { const t = colTotal(m, col); return t === 0 ? null : Math.round(m[row][col] / t * 100) }
const overallAcc      = m => { const c = CATEGORIES.reduce((s, cat) => s + m[cat][cat], 0); const t = totalItems(m); return t === 0 ? null : Math.round(c / t * 100) }
const totalMissorted  = m => CATEGORIES.reduce((s, col) => s + CATEGORIES.reduce((ss, row) => row === col ? ss : ss + (m[row][col] ?? 0), 0), 0)
const diverted        = m => (m.Recycling?.Recycling ?? 0) + (m.Compost?.Compost ?? 0)

/* ── Format helpers ──────────────────────────────── */
const fmt12   = t => { const [h, min] = t.split(':').map(Number); return `${h % 12 || 12}:${String(min).padStart(2,'0')} ${h >= 12 ? 'pm' : 'am'}` }
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

/* ── Live clock ──────────────────────────────────── */
function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 10000); return () => clearInterval(id) }, [])
  return now
}

/* ── AI helpers ──────────────────────────────────── */
function buildDataContext() {
  const t = totalItems(MATRIX), mis = totalMissorted(MATRIX)

  // Confusion matrix detail
  const matrixDetail = CATEGORIES.flatMap(row =>
    CATEGORIES.map(col => `${row}→${col}: ${MATRIX[row][col]} items (${pct(MATRIX,row,col)}%)`)
  ).join(', ')

  // Per-session breakdown
  const sessionDetail = DAILY_SESSIONS.map(s => {
    const acc = Math.round(s.correct / s.total * 100)
    const miss = s.total - s.correct
    return `${s.grade} on ${s.date}: ${s.total} items, ${miss} missorted, ${acc}% accuracy`
  }).join('; ')

  return [
    `=== ICanSort Dashboard Data ===`,
    `Total items sorted: ${t} across Grades 3–8, April 7–14 2026.`,
    `Overall accuracy: ${overallAcc(MATRIX)}%. Total missorted: ${mis} items (${Math.round(mis/t*100)}%).`,
    `Items diverted from landfill (correct recycling + compost): ${diverted(MATRIX)} (${Math.round(diverted(MATRIX)/t*100)}%).`,
    `Category accuracy — Garbage: ${pct(MATRIX,'Garbage','Garbage')}%, Recycling: ${pct(MATRIX,'Recycling','Recycling')}%, Compost: ${pct(MATRIX,'Compost','Compost')}%.`,
    `Overall (Actual→Guessed): ${matrixDetail}.`,
    `Top missorted items: ${TOP_MISSORTED.map(i=>`"${i.item}" sorted as ${i.guessed} ${i.pct}% of the time (should be ${i.actual})`).join('; ')}.`,
    `Per-session results: ${sessionDetail}.`,
  ].join('\n')
}

function buildSystemPrompt() {
  return `You are Binnie, a friendly and encouraging robot assistant built into the ICanSort school waste-sorting dashboard. Teachers and staff use you to understand student sorting data and get practical advice on improving results.

YOUR ROLE:
- Answer questions strictly about the data shown in this dashboard.
- Suggest specific, age-appropriate teaching strategies to help students improve their sorting accuracy.
- Be warm, encouraging, and concise — 2 to 4 sentences max unless a list is genuinely helpful.
- Never discuss topics unrelated to waste sorting, this dashboard, or teaching strategies for it.
- If asked something outside your scope, politely redirect: "I can only help with the sorting data and teaching strategies — try asking about accuracy, missorted items, or how to help students improve!"

TEACHING STRATEGY IDEAS YOU CAN DRAW FROM:
- Visual anchor charts near bins showing what goes where with pictures
- "Sort it!" warm-up games at the start of class using item cards
- Peer teaching: high-accuracy students explain their thinking to others
- Focus lessons on the most-confused items (e.g. plastic bags, juice boxes)
- "Why does it matter?" discussions linking sorting to landfill impact
- Grade-level competitions or class challenges using accuracy data
- Hands-on sorting stations with real (clean) items
- Error analysis: show students the confusion matrix and ask them to spot patterns

CURRENT DASHBOARD DATA:
${buildDataContext()}`
}

/* ── Views ───────────────────────────────────────── */
function MatrixView({ matrix }) {
  return (
    <div className="mx-outer">
      <div className="mx">
        {/* “Actual →” spanning the 3 cell columns, row 1 */}
        <div className="mx-col-axis">Actual →</div>
        {/* Column headers, row 2 */}
        {CATEGORIES.map((c, i) => (
          <div key={c} className="mx-col-head" style={{gridColumn: i+2, gridRow: 2}}>
            {CAT_ICON[c]} {c}
          </div>
        ))}
        {/* Data rows */}
        {CATEGORIES.flatMap((row, ri) => [
          <div key={`h-${row}`} className="mx-row-head" style={{gridColumn: 1, gridRow: ri+3}}>
            {CAT_ICON[row]} {row}
          </div>,
          ...CATEGORIES.map((col, ci) => {
            const v = pct(matrix, row, col)
            return (
              <div
                key={`${row}-${col}`}
                className={`mx-cell ${row===col ? 'mx-correct' : 'mx-wrong'}`}
                style={{'--v':(v??0)/100, gridColumn: ci+2, gridRow: ri+3}}
              >
                <span className="mx-pct">{v==null ? '—' : `${v}%`}</span>
                <span className="mx-count">{matrix[row][col]}</span>
              </div>
            )
          }),
        ])}
      </div>
      {/* “Guessed ↓” sits to the right of the entire grid */}
      <div className="mx-row-axis"><span>Guessed →</span></div>
    </div>
  )
}

function DailyView({ sessions }) {
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
  return (
    <div className="daily-wrap">
      {dates.map(date => {
        const rows     = sessions.filter(s => s.date === date)
        const dayTotal = rows.reduce((s,r) => s+r.total, 0)
        const dayMiss  = rows.reduce((s,r) => s+(r.total-r.correct), 0)
        return (
          <div key={date} className="daily-block">
            <div className="daily-date">{fmtDate(date)}</div>
            <table className="daily-table">
              <thead><tr><th>Class</th><th>Grade</th><th>Items</th><th>Missorted</th><th>Accuracy</th></tr></thead>
              <tbody>
                {rows.map(s => {
                  const miss = s.total - s.correct
                  const acc  = Math.round(s.correct / s.total * 100)
                  return (
                    <tr key={s.grade}>
                      <td className="dt-grade">{s.name || s.grade}</td>
                      <td className="dt-sub">{s.grade}</td>
                      <td>{s.total}</td>
                      <td className="dt-miss">{miss}</td>
                      <td className="dt-acc">{acc}%</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="dt-grade dt-total" colSpan={2}>Day total</td>
                  <td className="dt-total">{dayTotal}</td>
                  <td className="dt-miss dt-total">{dayMiss}</td>
                  <td className="dt-acc dt-total">{Math.round((dayTotal-dayMiss)/dayTotal*100)}%</td>
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
          <span className="tm-rank">#{i+1}</span>
          <div className="tm-info">
            <span className="tm-name">{item.item}</span>
            <span className="tm-detail">
              sorted as <span style={{color:CAT_COLOR[item.guessed]}}>{CAT_ICON[item.guessed]} {item.guessed}</span>
              {' · '}should be <span style={{color:CAT_COLOR[item.actual]}}>{CAT_ICON[item.actual]} {item.actual}</span>
            </span>
          </div>
          <div className="tm-bar-track"><div className="tm-bar-fill" style={{width:`${item.pct}%`}} /></div>
          <span className="tm-pct">{item.pct}%</span>
        </div>
      ))}
    </div>
  )
}

function ScheduleEditor({ schedule, setSchedule, onClose }) {
  const [draft, setDraft] = useState(schedule.map(s => ({ ...s })))

  function update(id, field, val) {
    setDraft(d => d.map(s => s.id === id ? { ...s, [field]: val } : s))
  }

  function addRow() {
    const newId = Date.now()
    setDraft(d => [...d, { id: newId, name: '', grade: 'Grade 3', start: '08:00', end: '08:45' }])
  }

  function removeRow(id) {
    setDraft(d => d.filter(s => s.id !== id))
  }

  function save() {
    setSchedule(draft)
    onClose()
  }

  return (
    <div className="sched-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sched-panel">
        <div className="sched-header">
          <span className="sched-title">Edit Classes &amp; Schedule</span>
          <button className="sched-close" onClick={onClose}>✕</button>
        </div>

        <div className="sched-body">
          <div className="sched-row sched-row-head">
            <span>Class Name</span>
            <span>Grade</span>
            <span>Start</span>
            <span>End</span>
            <span />
          </div>

          {draft.map(s => (
            <div key={s.id} className="sched-row">
              <input
                className="sched-input"
                value={s.name}
                onChange={e => update(s.id, 'name', e.target.value)}
                placeholder="Ms. Gigg's Class"
              />
              <select
                className="sched-input sched-select"
                value={s.grade}
                onChange={e => update(s.id, 'grade', e.target.value)}
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input
                className="sched-input sched-time"
                type="time"
                value={s.start}
                onChange={e => update(s.id, 'start', e.target.value)}
              />
              <input
                className="sched-input sched-time"
                type="time"
                value={s.end}
                onChange={e => update(s.id, 'end', e.target.value)}
              />
              <button className="sched-del" onClick={() => removeRow(s.id)} title="Remove">✕</button>
            </div>
          ))}

          <button className="sched-add" onClick={addRow}>+ Add class</button>
        </div>

        <div className="sched-footer">
          <button className="sched-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sched-btn-save" onClick={save}>Save changes</button>
        </div>
      </div>
    </div>
  )
}

function ChatPanel() {
  const [msgs, setMsgs]       = useState([{ role: 'assistant', content: "Hi! My name is Binnie! I'm here to answer any questions you have, such as which grades missort most often, or strategies on how to help students!" }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const answerRef             = useRef(null)

  useEffect(() => { answerRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg) return
    setInput('')
    const history = [...msgs, { role: 'user', content: msg }]
    setMsgs(history)
    setLoading(true)
    const key = import.meta.env.VITE_GEMINI_KEY
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
            contents: history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        console.error('Gemini API error:', data)
        setMsgs([...history, { role: 'assistant', content: data.error?.message ?? `Error ${res.status}` }])
        setLoading(false)
        return
      }
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response.'
      setMsgs([...history, { role: 'assistant', content: reply }])
    } catch (err) {
      setMsgs([...history, { role: 'assistant', content: 'Network error — please try again.' }])
    }
    setLoading(false)
  }

  const lastAnswer = [...msgs].reverse().find(m => m.role === 'assistant')

  return (
    <div className="chat-bar">
      <img src="/Binnie.png" className="binnie-img" alt="Binnie" />
      <div className="chat-right">
        {(lastAnswer || loading) && (
          <div className="chat-response" ref={answerRef}>
            {loading
              ? <span className="chat-loading">Binnie is thinking…</span>
              : <span>{lastAnswer.content}</span>
            }
          </div>
        )}
        <form className="chat-form" onSubmit={e => { e.preventDefault(); send() }}>
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Binnie…"
            disabled={loading}
          />
          <button className="chat-send" type="submit" disabled={loading || !input.trim()}>Send</button>
        </form>
      </div>
    </div>
  )
}

/* ── App ─────────────────────────────────────────── */
export default function App() {
  const [view, setView]       = useState('matrix')
  const [schedOpen, setSchedOpen] = useState(false)
  const [schedule, setSchedule]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('ics-schedule')) || CLASSES_DEFAULT }
    catch { return CLASSES_DEFAULT }
  })
  useEffect(() => { localStorage.setItem('ics-schedule', JSON.stringify(schedule)) }, [schedule])

  const now      = useNow()
  const active   = getActiveSlot(schedule, now)
  const next     = getNextSlot(schedule, now)
  const acc      = overallAcc(MATRIX)
  const total    = totalItems(MATRIX)
  const missed   = totalMissorted(MATRIX)
  const missPct  = total > 0 ? Math.round(missed / total * 100) : null
  const div      = 54
  const timeStr  = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="page">

      <header className="header">
        <img src="/icansortlogo.png" className="logo-img" alt="ICanSort" />
        <div className="header-right">
          <span className="clock">{timeStr}</span>
          {active
            ? <button className="badge badge-active badge-btn" onClick={() => setSchedOpen(true)}>{active.name || active.grade} · now</button>
            : next
              ? <button className="badge badge-next badge-btn" onClick={() => setSchedOpen(true)}>Next: {next.name || next.grade} at {fmt12(next.start)}</button>
              : <button className="badge badge-done badge-btn" onClick={() => setSchedOpen(true)}>No more sessions today</button>
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
              <span className="kpi-val kpi-red">{missed} <span className="kpi-sub">{missPct !== null ? `${missPct}%` : ''}</span></span>
              <span className="kpi-lbl">Missorted</span>
            </div>
            <div className="kpi">
              <span className="kpi-val kpi-blue">{div.toLocaleString()}</span>
              <span className="kpi-lbl">Diverted from landfill</span>
            </div>
          </div>

          <div className="tabs">
            {[['matrix','Overall'],['daily','Daily']].map(([id, label]) => (
              <button key={id} className={`tab${view===id?' tab-active':''}`} onClick={() => setView(id)}>{label}</button>
            ))}
          </div>

          <div className="tab-panel">
            {view === 'matrix' && (
              <>
                <MatrixView matrix={MATRIX} />
                <div className="topmiss-section-title">Top Missorted</div>
                <TopMissortedView items={TOP_MISSORTED} />
              </>
            )}
            {view === 'daily' && <DailyView sessions={DAILY_SESSIONS} />}
          </div>

        </section>
      </main>

      <ChatPanel />

      {schedOpen && (
        <ScheduleEditor
          schedule={schedule}
          setSchedule={setSchedule}
          onClose={() => setSchedOpen(false)}
        />
      )}

    </div>
  )
}
