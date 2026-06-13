// Adaptive difficulty engine — pure, stateless functions.
//
// The learner is modeled by a continuous `skill` estimate in [1, 5]. After each
// answer we nudge it: correct answers raise it slowly (with a streak bonus so a
// run of correct answers ramps up), wrong answers lower it a bit so the next
// question is slightly easier. The next question is drawn at random from the
// unanswered pool nearest the learner's current level — so two runs differ, and
// difficulty tracks the learner.

import { MIN_DIFFICULTY, MAX_DIFFICULTY } from '../data/categories.js'

// Tunable so the feel can be adjusted in one place.
export const ENGINE_CONFIG = {
  startingSkill: 1.0, // everyone starts at the easiest band
  upStep: 0.34, // ~3 correct answers to climb one level (slow ramp up)
  streakBonus: 0.12, // each consecutive correct adds a little extra momentum
  maxStreakBonus: 3, // cap the streak contribution
  downStep: 0.55, // a wrong answer drops difficulty "slightly" (~half a level)
  // Reward answering above your level / penalize missing below it, mildly.
  stretchFactor: 0.25,
}

export const clampSkill = (s) =>
  Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, s))

export const skillToLevel = (s) =>
  Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Math.round(s)))

// Compute the next skill estimate after answering a question of `difficulty`.
// `streak` is the count of consecutive correct answers *before* this one.
export function updateSkill(skill, difficulty, correct, streak = 0, cfg = ENGINE_CONFIG) {
  if (correct) {
    // Bonus when the answered question was at or above the current level.
    const stretch = Math.max(0, difficulty - skill) * cfg.stretchFactor
    const momentum = Math.min(streak, cfg.maxStreakBonus) * cfg.streakBonus
    return clampSkill(skill + cfg.upStep + stretch + momentum)
  }
  // Wrong: drop more if the question was below the learner's level (it should
  // have been easy), less if it was a stretch question.
  const overreach = Math.max(0, skill - difficulty) * cfg.stretchFactor
  return clampSkill(skill - cfg.downStep - overreach)
}

// Build the candidate pool: unanswered questions, optionally restricted to a
// set of categories.
export function availablePool(questions, answeredIds, categories = null) {
  const catSet = categories && categories.length ? new Set(categories) : null
  return questions.filter(
    (q) => !answeredIds.has(q.id) && (!catSet || catSet.has(q.category))
  )
}

// Pick the next question for a learner at the given skill from a candidate pool.
// Strategy: find the nearest difficulty level that actually has unanswered
// questions (expanding the search radius), then choose uniformly at random among
// them. Returns null when the pool is exhausted.
export function selectNextQuestion(pool, skill, rng = Math.random) {
  if (!pool.length) return null

  const target = skillToLevel(skill)

  // Group by difficulty once.
  const byLevel = new Map()
  for (const q of pool) {
    if (!byLevel.has(q.difficulty)) byLevel.set(q.difficulty, [])
    byLevel.get(q.difficulty).push(q)
  }

  // Expand outward from the target level until we find a non-empty band.
  for (let radius = 0; radius <= MAX_DIFFICULTY - MIN_DIFFICULTY; radius++) {
    const candidates = []
    const below = target - radius
    const above = target + radius
    if (byLevel.has(below)) candidates.push(...byLevel.get(below))
    if (above !== below && byLevel.has(above)) candidates.push(...byLevel.get(above))
    if (candidates.length) {
      return candidates[Math.floor(rng() * candidates.length)]
    }
  }

  // Fallback: any question in the pool.
  return pool[Math.floor(rng() * pool.length)]
}

// Convenience: given full state, return the next question (or null).
export function nextQuestion(questions, { answeredIds, skill, categories } = {}, rng = Math.random) {
  const pool = availablePool(questions, answeredIds ?? new Set(), categories)
  return selectNextQuestion(pool, skill ?? ENGINE_CONFIG.startingSkill, rng)
}

// ---- Option presentation ---------------------------------------------------
// A question carries a correct answer plus a distractor pool. Each time it is
// served we sample `displayCount` options (always including the correct one) and
// shuffle them, so the displayed choices and the position of the answer vary.

function shuffleInPlace(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Pick up to k items uniformly at random without replacement.
export function sampleWithoutReplacement(items, k, rng = Math.random) {
  const copy = items.slice()
  shuffleInPlace(copy, rng)
  return copy.slice(0, Math.max(0, Math.min(k, copy.length)))
}

// Build the concrete options to display for a question this time around.
// Returns { options: string[], answer: number } where `answer` indexes the
// correct option within the returned (shuffled) array.
export function buildOptions(question, rng = Math.random) {
  const poolSize = 1 + question.distractors.length
  const count = Math.min(question.displayCount ?? 4, poolSize)
  const picks = sampleWithoutReplacement(question.distractors, count - 1, rng)
  const options = shuffleInPlace([question.correct, ...picks], rng)
  return { options, answer: options.indexOf(question.correct) }
}
