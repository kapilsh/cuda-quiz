// Terse authoring format -> normalized question objects.
//
// Authors write compact records; this expands them into the canonical schema
// and assigns stable ids of the form "<category>-<NNN>" based on position.
//
// Compact record fields:
//   d    number   difficulty 1..5                    (required)
//   q    string   question prompt                    (required)
//   o    string[] the "primary" options (2..6)       (required)
//   a    number   index of the correct option in `o` (required)
//   x    string[] extra distractors beyond `o`       (optional)
//   pick number   how many options to show (default 4, capped at the pool)
//   e    string   explanation shown after answering  (required)
//   ref  string   source / further reading           (optional)
//   tags string[] topical tags                       (optional)
//
// The correct answer plus all wrong options (the other `o` entries + `x`) form a
// distractor *pool*. At serve time the engine samples `displayCount` options —
// always including the correct one — and shuffles them, so different players /
// replays can see different choices in different positions. See
// engine/adaptiveEngine.js `buildOptions`.
//
// Canonical schema (consumed by the app):
//   { id, category, difficulty, question, correct, distractors, displayCount,
//     explanation, reference, tags }

export const DEFAULT_DISPLAY_COUNT = 4

// `category` tags the question for filtering/metadata. `opts.idPrefix` lets a
// category be split across multiple batch files without id collisions — e.g.
// defineQuestions('basics', [...], { idPrefix: 'basics-b' }) yields ids like
// "basics-b-001". Ids only need to be unique + stable within a session; nothing
// is persisted by id, so the scheme is free to evolve.
export function defineQuestions(category, records, opts = {}) {
  const { idPrefix = category } = opts
  return records.map((r, i) => {
    const id = `${idPrefix}-${String(i + 1).padStart(3, '0')}`
    const correct = r.o[r.a]
    const baseDistractors = r.o.filter((_, idx) => idx !== r.a)
    const distractors = [...baseDistractors, ...(r.x ?? [])]
    return {
      id,
      category,
      difficulty: r.d,
      question: r.q,
      correct,
      distractors,
      displayCount: r.pick ?? DEFAULT_DISPLAY_COUNT,
      explanation: r.e,
      reference: r.ref ?? null,
      tags: r.tags ?? [],
    }
  })
}
