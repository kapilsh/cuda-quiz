import { useEffect } from 'react'
import { useQuizStore, selectLevel } from '../store/quizStore.js'
import { CATEGORY_BY_ID, DIFFICULTY_LEVELS } from '../data/categories.js'
import DifficultyMeter from './DifficultyMeter.jsx'

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function QuizView() {
  const current = useQuizStore((s) => s.current)
  const options = useQuizStore((s) => s.currentOptions)
  const answerIdx = useQuizStore((s) => s.currentAnswer)
  const selected = useQuizStore((s) => s.selected)
  const revealed = useQuizStore((s) => s.revealed)
  const answer = useQuizStore((s) => s.answer)
  const next = useQuizStore((s) => s.next)
  const finish = useQuizStore((s) => s.finish)

  const streak = useQuizStore((s) => s.streak)
  const answered = useQuizStore((s) => s.answered)
  const correct = useQuizStore((s) => s.correct)
  const sessionLength = useQuizStore((s) => s.sessionLength)
  const level = useQuizStore(selectLevel)

  // Keyboard: A–F (or 1–6) to answer, Enter/→ to advance.
  useEffect(() => {
    const onKey = (e) => {
      if (!current) return
      if (!revealed) {
        const upper = e.key.toUpperCase()
        let idx = OPTION_KEYS.indexOf(upper)
        if (idx === -1 && /^[1-9]$/.test(e.key)) idx = Number(e.key) - 1
        if (idx >= 0 && idx < options.length) {
          e.preventDefault()
          answer(idx)
        }
      } else if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, revealed, answer, next, options.length])

  if (!current) return null

  const cat = CATEGORY_BY_ID[current.category]
  const diffLabel = DIFFICULTY_LEVELS[current.difficulty - 1]?.label ?? `L${current.difficulty}`
  const progressPct =
    sessionLength != null ? Math.min(100, (answered / sessionLength) * 100) : null

  return (
    <div className="quiz">
      <div className="hud">
        <div className="hud-left">
          <DifficultyMeter level={level} />
          <div className="hud-skill">
            <span className="hud-skill-label">your level</span>
            <span className="hud-skill-value mono">L{level}</span>
          </div>
        </div>
        <div className="hud-right">
          <HudStat label="streak" value={`${streak}🔥`} highlight={streak >= 3} />
          <HudStat label="score" value={`${correct}/${answered}`} />
          <button type="button" className="btn-ghost" onClick={finish}>
            End
          </button>
        </div>
      </div>

      {progressPct != null && (
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <span className="progress-text mono">
            {answered}/{sessionLength}
          </span>
        </div>
      )}

      <article className="card">
        <div className="card-meta">
          <span className="tag" style={{ color: cat.color, borderColor: cat.color }}>
            <span className="tag-dot" style={{ background: cat.color }} />
            {cat.short}
          </span>
          <span className="tag tag-diff">{diffLabel} · L{current.difficulty}</span>
        </div>

        <h2 className="question">{current.question}</h2>

        <ul className="options">
          {options.map((opt, i) => {
            const isAnswer = i === answerIdx
            const isPicked = i === selected
            let cls = 'option'
            if (revealed) {
              if (isAnswer) cls += ' correct'
              else if (isPicked) cls += ' wrong'
              else cls += ' muted'
            }
            return (
              <li key={i}>
                <button
                  type="button"
                  className={cls}
                  disabled={revealed}
                  onClick={() => answer(i)}
                >
                  <span className="option-key mono">{OPTION_KEYS[i]}</span>
                  <span className="option-text">{opt}</span>
                  {revealed && isAnswer && <span className="option-mark">✓</span>}
                  {revealed && isPicked && !isAnswer && <span className="option-mark">✕</span>}
                </button>
              </li>
            )
          })}
        </ul>

        {revealed && (
          <div className={`explain${selected === answerIdx ? ' good' : ' bad'}`}>
            <div className="explain-head">
              {selected === answerIdx ? 'Correct' : 'Not quite'}
            </div>
            <p className="explain-body">{current.explanation}</p>
            {current.reference && (
              <p className="explain-ref mono">↳ {current.reference}</p>
            )}
            <button type="button" className="btn-primary explain-next" onClick={next}>
              Next →
            </button>
          </div>
        )}
      </article>

      <p className="kbd-hint mono">
        {revealed ? 'Enter / → for next' : 'Press A–D or 1–4 to answer'}
      </p>
    </div>
  )
}

function HudStat({ label, value, highlight }) {
  return (
    <div className={`hud-stat${highlight ? ' hot' : ''}`}>
      <span className="hud-stat-value mono">{value}</span>
      <span className="hud-stat-label">{label}</span>
    </div>
  )
}
