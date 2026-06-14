// How mechanical is shortening the correct option? Many correct answers were
// written as "Answer — justification" / "Answer; justification" / "Answer (…)".
// Check how often the correct option splits cleanly at such a separator, what
// the leading "answer" looks like, and whether trimming would collide with a
// distractor or be too terse.

import { QUESTIONS } from '../src/data/questions/index.js'

// Ordered: try the strongest justification separators first.
const SEPARATORS = [' — ', ' – ', ' -- ', '; ', ' (', ': ']

function splitHead(s) {
  for (const sep of SEPARATORS) {
    const i = s.indexOf(sep)
    if (i > 0) return { head: s.slice(0, i).trim(), sep }
  }
  return null
}

let hasSep = 0
let cleanTrim = 0 // splits, head reasonably sized, no collision
let collision = 0
let tooShort = 0
let noSep = 0
const noSepSamples = []
const headLens = []

for (const q of QUESTIONS) {
  const sp = splitHead(q.correct)
  if (!sp) {
    noSep++
    if (q.correct.length > 60 && noSepSamples.length < 20) noSepSamples.push(q.id + '  ::  ' + q.correct)
    continue
  }
  hasSep++
  const head = sp.head
  headLens.push(head.length)
  const distractors = q.distractors.map((d) => d.toLowerCase())
  if (distractors.includes(head.toLowerCase())) collision++
  else if (head.length < 4) tooShort++
  else cleanTrim++
}

const n = QUESTIONS.length
const pct = (x) => ((x / n) * 100).toFixed(1) + '%'
headLens.sort((a, b) => a - b)
const median = headLens[Math.floor(headLens.length / 2)] ?? 0

console.log(`Questions: ${n}\n`)
console.log(`Correct option has a justification separator: ${hasSep} (${pct(hasSep)})`)
console.log(`  → clean trim candidate:  ${cleanTrim} (${pct(cleanTrim)})`)
console.log(`  → would collide w/ distractor: ${collision}`)
console.log(`  → head too short (<4 chars):  ${tooShort}`)
console.log(`No separator (correct is a plain phrase): ${noSep} (${pct(noSep)})`)
console.log(`\nTrimmed-head length: median ${median}, min ${headLens[0]}, max ${headLens[headLens.length - 1]}`)
console.log(`\nSample LONG correct options WITHOUT a separator (need manual rewrite):`)
noSepSamples.forEach((s) => console.log('  ' + s.slice(0, 130)))
