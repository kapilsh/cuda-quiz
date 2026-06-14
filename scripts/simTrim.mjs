// Simulate: if we shorten each correct option to its "head" (text before the
// first justification separator), does the "correct is the longest option" bias
// go away? This tells us whether a script-assisted bulk trim is viable vs. a
// fully manual rewrite.

import { QUESTIONS } from '../src/data/questions/index.js'

const SEPARATORS = [' — ', ' – ', ' -- ', '; ', ' (', ': ']
function trim(s) {
  for (const sep of SEPARATORS) {
    const i = s.indexOf(sep)
    if (i > 3) return s.slice(0, i).trim()
  }
  return s
}

// "Obviously longer" = correct exceeds the longest distractor by a margin a
// reader would actually notice. Tune the threshold.
const OBVIOUS_GAP = 25

let beforeObvious = 0
let afterObvious = 0
const buckets = { '<=0': 0, '1-10': 0, '11-25': 0, '26-50': 0, '51-100': 0, '>100': 0 }
const residual = []

const bucketOf = (g) =>
  g <= 0 ? '<=0' : g <= 10 ? '1-10' : g <= 25 ? '11-25' : g <= 50 ? '26-50' : g <= 100 ? '51-100' : '>100'

for (const q of QUESTIONS) {
  const maxD = Math.max(...q.distractors.map((d) => d.length))
  if (q.correct.length - maxD > OBVIOUS_GAP) beforeObvious++

  const t = trim(q.correct)
  const gap = t.length - maxD
  buckets[bucketOf(gap)]++
  if (gap > OBVIOUS_GAP) {
    afterObvious++
    if (residual.length < 30) residual.push(`${q.id} (+${gap}): ${t.slice(0, 80)}`)
  }
}

const n = QUESTIONS.length
const pct = (x) => ((x / n) * 100).toFixed(1) + '%'
console.log(`Questions: ${n}  (OBVIOUS gap threshold: >${OBVIOUS_GAP} chars)\n`)
console.log(`BEFORE — correct OBVIOUSLY longer than longest distractor: ${beforeObvious} (${pct(beforeObvious)})`)
console.log(`AFTER trim — correct OBVIOUSLY longer: ${afterObvious} (${pct(afterObvious)})`)
console.log(`\nAfter-trim gap (correct.length - longest distractor) buckets:`)
for (const [k, v] of Object.entries(buckets)) console.log(`  ${k.padStart(7)}: ${v} (${pct(v)})`)
console.log(`\nResidual "obviously longer even after trim" (the manual-fix set): ${afterObvious}`)
residual.forEach((s) => console.log('  ' + s))
