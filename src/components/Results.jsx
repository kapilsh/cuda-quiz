import { useMemo } from 'react'
import { useQuizStore, selectLevel } from '../store/quizStore.js'
import { CATEGORY_BY_ID } from '../data/categories.js'

export default function Results() {
  const history = useQuizStore((s) => s.history)
  const answered = useQuizStore((s) => s.answered)
  const correct = useQuizStore((s) => s.correct)
  const level = useQuizStore(selectLevel)
  const categories = useQuizStore((s) => s.categories)
  const sessionLength = useQuizStore((s) => s.sessionLength)
  const startQuiz = useQuizStore((s) => s.startQuiz)
  const reset = useQuizStore((s) => s.reset)

  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0
  const missed = useMemo(() => history.filter((h) => !h.correct), [history])

  const byCategory = useMemo(() => {
    const m = {}
    for (const h of history) {
      const c = (m[h.question.category] ??= { total: 0, correct: 0 })
      c.total++
      if (h.correct) c.correct++
    }
    return m
  }, [history])

  const verdict =
    accuracy >= 90
      ? 'Elite — you know your warps from your wavefronts.'
      : accuracy >= 75
        ? 'Strong. Solid CUDA fundamentals and then some.'
        : accuracy >= 50
          ? 'Getting there — review the misses below.'
          : 'Early days. The explanations below are your study list.'

  return (
    <div className="results">
      <section className="results-hero">
        <div className="score-ring" style={{ '--pct': accuracy }}>
          <div className="score-ring-inner">
            <span className="score-num mono">{accuracy}%</span>
            <span className="score-cap">accuracy</span>
          </div>
        </div>
        <div className="results-summary">
          <h1>Session complete</h1>
          <p className="results-verdict">{verdict}</p>
          <div className="results-stats">
            <Mini label="Correct" value={`${correct}/${answered}`} />
            <Mini label="Reached" value={`Level ${level}`} />
            <Mini label="Missed" value={missed.length} />
          </div>
        </div>
      </section>

      <div className="results-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => startQuiz({ categories, sessionLength })}
        >
          Play again
        </button>
        <button type="button" className="btn-ghost" onClick={reset}>
          Change topics
        </button>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <section className="results-panel">
          <h2 className="panel-title">By topic</h2>
          <div className="cat-bars">
            {Object.entries(byCategory)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([id, c]) => {
                const cat = CATEGORY_BY_ID[id]
                const pct = Math.round((c.correct / c.total) * 100)
                return (
                  <div key={id} className="cat-bar">
                    <span className="cat-bar-label">{cat?.short ?? id}</span>
                    <div className="cat-bar-track">
                      <div
                        className="cat-bar-fill"
                        style={{ width: `${pct}%`, background: cat?.color ?? 'var(--nv-green)' }}
                      />
                    </div>
                    <span className="cat-bar-num mono">
                      {c.correct}/{c.total}
                    </span>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {missed.length > 0 && (
        <section className="results-panel">
          <h2 className="panel-title">Review your misses ({missed.length})</h2>
          <ul className="review-list">
            {missed.map((h) => {
              const q = h.question
              const cat = CATEGORY_BY_ID[q.category]
              return (
                <li key={h.id} className="review-item">
                  <div className="review-q">{q.question}</div>
                  <div className="review-a">
                    <span className="review-x mono">your answer:</span>{' '}
                    <span className="review-wrong">{h.options[h.selected]}</span>
                  </div>
                  <div className="review-a">
                    <span className="review-x mono">correct:</span>{' '}
                    <span className="review-right">{h.options[h.answer]}</span>
                  </div>
                  <p className="review-explain">{q.explanation}</p>
                  {q.reference && <p className="review-ref mono">↳ {q.reference}</p>}
                  <span className="review-tag" style={{ color: cat?.color }}>
                    {cat?.short} · L{q.difficulty}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="mini-stat">
      <span className="mini-value mono">{value}</span>
      <span className="mini-label">{label}</span>
    </div>
  )
}
