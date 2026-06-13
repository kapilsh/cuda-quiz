import { MAX_DIFFICULTY } from '../data/categories.js'

// Five-segment meter visualizing the learner's current level.
export default function DifficultyMeter({ level }) {
  return (
    <div className="meter" title={`Difficulty level ${level} of ${MAX_DIFFICULTY}`}>
      {Array.from({ length: MAX_DIFFICULTY }, (_, i) => (
        <span key={i} className={`meter-seg${i < level ? ' on' : ''}`} />
      ))}
    </div>
  )
}
