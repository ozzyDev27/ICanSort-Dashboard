import { useEffect, useState } from 'react'
import './App.css'

const CATEGORIES = ['Garbage', 'Recycling', 'Compost']

const DEFAULT_MATRIX = {
  Garbage:   { Garbage: 82, Recycling: 10, Compost:  5 },
  Recycling: { Garbage:  9, Recycling: 76, Compost: 12 },
  Compost:   { Garbage:  9, Recycling: 14, Compost: 83 },
}

function colTotal(matrix, col) {
  return CATEGORIES.reduce((sum, row) => sum + (matrix[row][col] ?? 0), 0)
}

function pct(matrix, row, col) {
  const total = colTotal(matrix, col)
  if (total === 0) return null
  return Math.round((matrix[row][col] / total) * 100)
}

function App() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX)
  const [summary, setSummary] = useState('')

  useEffect(() => {}, [])

  return (
    <div className="page">
      <header className="header">
        <span className="logo">ICanSort</span>
        <span className="header-sub">sorting accuracy</span>
      </header>

      <main className="main">

        <section className="section">
          <table className="matrix">
            <thead>
              <tr>
                <th className="corner" colSpan={2} />
                <th className="axis-label" colSpan={3}>Actual</th>
              </tr>
              <tr>
                <th className="corner" colSpan={2} />
                {CATEGORIES.map(c => <th key={c} className="head">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((row, ri) => (
                <tr key={row}>
                  {ri === 0 && <th className="guessed-label" rowSpan={3}>Guessed</th>}
                  <th className="row-head">{row}</th>
                  {CATEGORIES.map(col => {
                    const val = pct(matrix, row, col)
                    const isDiag = row === col
                    return (
                      <td
                        key={col}
                        className={`cell ${isDiag ? 'correct' : 'wrong'}`}
                        style={{ '--v': (val ?? 0) / 100 }}
                      >
                        {val === null ? '—' : `${val}%`}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section">
          <div className="section-label">Summary</div>
          <p className="summary">
            {summary || 'Wiwiwi. Wiwiwiwiwiwi, wiwiwiwi! Wiwiwiwiwi? Wiwiwiwiwi.'}
          </p>
        </section>

      </main>
    </div>
  )
}

export default App
