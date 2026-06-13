import { create } from 'zustand'
import { QUESTIONS } from '../data/questions/index.js'
import {
  ENGINE_CONFIG,
  updateSkill,
  skillToLevel,
  availablePool,
  selectNextQuestion,
  buildOptions,
} from '../engine/adaptiveEngine.js'

// ---- Persistent (cross-session) stats -------------------------------------
// Only aggregate stats are stored — never which questions were "passed", since
// the honor system is the whole point. Kept tiny and resilient to schema drift.

const STATS_KEY = 'cuda-quiz:stats:v1'

const emptyStats = () => ({
  lifetimeAnswered: 0,
  lifetimeCorrect: 0,
  bestStreak: 0,
  highestLevelReached: 1,
  sessionsCompleted: 0,
})

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return emptyStats()
    return { ...emptyStats(), ...JSON.parse(raw) }
  } catch {
    return emptyStats()
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// ---- Store -----------------------------------------------------------------

export const useQuizStore = create((set, get) => ({
  // session status: 'idle' | 'active' | 'finished'
  status: 'idle',

  // adaptive state
  skill: ENGINE_CONFIG.startingSkill,
  streak: 0, // consecutive correct in this session
  categories: null, // null = all topics; otherwise array of category ids

  // current question lifecycle
  current: null,
  currentOptions: [], // options as displayed this time (sampled + shuffled)
  currentAnswer: null, // index of the correct option within currentOptions
  selected: null, // index the user picked (null until answered)
  revealed: false,

  // session tallies
  answeredIds: new Set(),
  history: [], // { id, question, selected, correct, difficulty, skillAfter }
  answered: 0,
  correct: 0,

  // optional cap on questions per session (null = until pool exhausted)
  sessionLength: null,

  // persistent stats
  stats: loadStats(),

  // -- actions --------------------------------------------------------------

  startQuiz({ categories = null, sessionLength = null } = {}) {
    const answeredIds = new Set()
    const skill = ENGINE_CONFIG.startingSkill
    const pool = availablePool(QUESTIONS, answeredIds, categories)
    const first = selectNextQuestion(pool, skill)
    const served = first ? buildOptions(first) : { options: [], answer: null }
    set({
      status: first ? 'active' : 'finished',
      skill,
      streak: 0,
      categories,
      sessionLength,
      current: first,
      currentOptions: served.options,
      currentAnswer: served.answer,
      selected: null,
      revealed: false,
      answeredIds,
      history: [],
      answered: 0,
      correct: 0,
    })
  },

  answer(index) {
    const state = get()
    if (state.revealed || !state.current) return // ignore double-answers

    const q = state.current
    const isCorrect = index === state.currentAnswer
    const newStreak = isCorrect ? state.streak + 1 : 0
    const newSkill = updateSkill(state.skill, q.difficulty, isCorrect, state.streak)

    const answeredIds = new Set(state.answeredIds)
    answeredIds.add(q.id)

    const history = [
      ...state.history,
      {
        id: q.id,
        question: q,
        // Snapshot exactly what the user saw (options vary per serving).
        options: state.currentOptions,
        answer: state.currentAnswer,
        selected: index,
        correct: isCorrect,
        difficulty: q.difficulty,
        skillAfter: newSkill,
      },
    ]

    // Update persistent stats.
    const stats = {
      ...state.stats,
      lifetimeAnswered: state.stats.lifetimeAnswered + 1,
      lifetimeCorrect: state.stats.lifetimeCorrect + (isCorrect ? 1 : 0),
      bestStreak: Math.max(state.stats.bestStreak, newStreak),
      highestLevelReached: Math.max(state.stats.highestLevelReached, skillToLevel(newSkill)),
    }
    saveStats(stats)

    set({
      selected: index,
      revealed: true,
      skill: newSkill,
      streak: newStreak,
      answeredIds,
      history,
      answered: state.answered + 1,
      correct: state.correct + (isCorrect ? 1 : 0),
      stats,
    })
  },

  next() {
    const state = get()
    if (!state.revealed) return // must answer current before advancing

    const reachedLimit =
      state.sessionLength != null && state.answered >= state.sessionLength
    const pool = availablePool(QUESTIONS, state.answeredIds, state.categories)
    const nextQ = reachedLimit ? null : selectNextQuestion(pool, state.skill)

    if (!nextQ) {
      const stats = { ...state.stats, sessionsCompleted: state.stats.sessionsCompleted + 1 }
      saveStats(stats)
      set({
        status: 'finished',
        current: null,
        currentOptions: [],
        currentAnswer: null,
        selected: null,
        revealed: false,
        stats,
      })
      return
    }

    const served = buildOptions(nextQ)
    set({
      current: nextQ,
      currentOptions: served.options,
      currentAnswer: served.answer,
      selected: null,
      revealed: false,
    })
  },

  finish() {
    const state = get()
    if (state.status !== 'active') return
    const stats = { ...state.stats, sessionsCompleted: state.stats.sessionsCompleted + 1 }
    saveStats(stats)
    set({ status: 'finished', stats })
  },

  reset() {
    set({
      status: 'idle',
      skill: ENGINE_CONFIG.startingSkill,
      streak: 0,
      categories: null,
      current: null,
      currentOptions: [],
      currentAnswer: null,
      selected: null,
      revealed: false,
      answeredIds: new Set(),
      history: [],
      answered: 0,
      correct: 0,
    })
  },
}))

// Derived selectors (kept out of the store to avoid re-render churn).
export const selectLevel = (s) => skillToLevel(s.skill)
export const selectRemaining = (s) => {
  const total = s.categories
    ? QUESTIONS.filter((q) => s.categories.includes(q.category)).length
    : QUESTIONS.length
  return total - s.answeredIds.size
}
