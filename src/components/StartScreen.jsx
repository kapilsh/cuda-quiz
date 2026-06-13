import { useState } from 'react'
import { useQuizStore } from '../store/quizStore.js'
import { CATEGORIES } from '../data/categories.js'

const LENGTH_OPTIONS = [
  { value: 10, label: '10 · quick' },
  { value: 25, label: '25 · standard' },
  { value: 50, label: '50 · deep' },
  { value: null, label: 'Endless' },
]

export default function StartScreen() {
  const startQuiz = useQuizStore((s) => s.startQuiz)
  const stats = useQuizStore((s) => s.stats)
  const [selected, setSelected] = useState(() => new Set()) // empty = all
  const [length, setLength] = useState(25)

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const begin = () => {
    const categories = selected.size === 0 ? null : [...selected]
    startQuiz({ categories, sessionLength: length })
  }

  const accuracy =
    stats.lifetimeAnswered > 0
      ? Math.round((stats.lifetimeCorrect / stats.lifetimeAnswered) * 100)
      : null

  return (
    <div className="start">
      <section className="start-hero">
        <h1 className="start-title">
          Test how well you really know <span className="hl">CUDA</span>.
        </h1>
        <p className="start-sub">
          A multiple-choice gauntlet spanning the programming model, memory
          hierarchy, kernel optimization, GPU architecture, libraries,
          multi-GPU/NCCL and distributed training. The quiz adapts: get one right
          and it gets harder, miss one and it eases off. No looking things up —
          that&rsquo;s the honor system.
        </p>
      </section>

      {stats.lifetimeAnswered > 0 && (
        <section className="start-stats">
          <Stat label="Answered" value={stats.lifetimeAnswered} />
          <Stat label="Accuracy" value={accuracy != null ? `${accuracy}%` : '—'} />
          <Stat label="Best streak" value={stats.bestStreak} />
          <Stat label="Top level" value={`L${stats.highestLevelReached}`} />
        </section>
      )}

      <section className="start-panel">
        <div className="panel-row">
          <h2 className="panel-title">Topics</h2>
          <span className="panel-hint">
            {selected.size === 0 ? 'All topics' : `${selected.size} selected`}
          </span>
        </div>
        <div className="topic-grid">
          {CATEGORIES.map((c) => {
            const on = selected.has(c.id)
            return (
              <button
                key={c.id}
                type="button"
                className={`topic-chip${on ? ' on' : ''}`}
                style={on ? { borderColor: c.color, boxShadow: `inset 0 0 0 1px ${c.color}` } : undefined}
                onClick={() => toggle(c.id)}
                aria-pressed={on}
              >
                <span className="topic-dot" style={{ background: c.color }} />
                <span className="topic-label">{c.short}</span>
              </button>
            )
          })}
        </div>
        <p className="panel-note">Leave all unselected to draw from every topic.</p>
      </section>

      <section className="start-panel">
        <div className="panel-row">
          <h2 className="panel-title">Session length</h2>
        </div>
        <div className="length-row">
          {LENGTH_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className={`length-chip${length === opt.value ? ' on' : ''}`}
              onClick={() => setLength(opt.value)}
              aria-pressed={length === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="btn-primary start-go" onClick={begin}>
        Start quiz →
      </button>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value mono">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
