// Diagnostic: does the CORRECT option tend to be the longest?
// A well-formed MCQ should not let a test-taker pick "the longest option" and
// be right. This reports how often the correct answer is the longest (or near),
// overall and per category, and lists the worst offenders.

import { QUESTIONS } from '../src/data/questions/index.js'

const len = (s) => s.length

let correctIsStrictMax = 0
let correctIsTop = 0 // tied-or-strict longest
let correctIsShortest = 0
const rankCounts = {} // rank of correct by length (1 = longest)
const byCategory = {}
let sumCorrect = 0
let sumDistractorMean = 0
const offenders = [] // correct much longer than 2nd longest

for (const q of QUESTIONS) {
  const pool = [q.correct, ...q.distractors]
  const lens = pool.map(len)
  const correctLen = len(q.correct)
  const distractorLens = q.distractors.map(len)
  const maxLen = Math.max(...lens)
  const minLen = Math.min(...lens)

  // rank of correct among pool by length (1 = longest)
  const sorted = [...lens].sort((a, b) => b - a)
  const rank = sorted.indexOf(correctLen) + 1
  rankCounts[rank] = (rankCounts[rank] ?? 0) + 1

  const strictMax = correctLen === maxLen && lens.filter((l) => l === maxLen).length === 1
  if (strictMax) correctIsStrictMax++
  if (correctLen === maxLen) correctIsTop++
  if (correctLen === minLen) correctIsShortest++

  sumCorrect += correctLen
  sumDistractorMean += distractorLens.reduce((a, b) => a + b, 0) / distractorLens.length

  const cat = (byCategory[q.category] ??= { n: 0, strictMax: 0 })
  cat.n++
  if (strictMax) cat.strictMax++

  // gap: how much longer is correct than the longest distractor
  const longestDistractor = Math.max(...distractorLens)
  if (correctLen > longestDistractor) {
    offenders.push({ id: q.id, gap: correctLen - longestDistractor, correctLen, longestDistractor })
  }
}

const n = QUESTIONS.length
const pct = (x) => ((x / n) * 100).toFixed(1) + '%'

console.log(`Questions analyzed: ${n}\n`)
console.log(`Correct option is the STRICT longest:  ${correctIsStrictMax} (${pct(correctIsStrictMax)})`)
console.log(`Correct option is longest (incl. ties): ${correctIsTop} (${pct(correctIsTop)})`)
console.log(`Correct option is the shortest:          ${correctIsShortest} (${pct(correctIsShortest)})`)
console.log(`\nMean length — correct: ${(sumCorrect / n).toFixed(0)} chars,  distractors: ${(sumDistractorMean / n).toFixed(0)} chars`)
console.log(`\nCorrect-answer length rank (1 = longest in its pool):`)
for (const r of Object.keys(rankCounts).sort((a, b) => a - b)) {
  console.log(`  rank ${r}: ${rankCounts[r]} (${pct(rankCounts[r])})`)
}
console.log(`\nPer category (% where correct is strict longest):`)
for (const [cat, v] of Object.entries(byCategory).sort((a, b) => b[1].strictMax / b[1].n - a[1].strictMax / a[1].n)) {
  console.log(`  ${cat.padEnd(16)} ${((v.strictMax / v.n) * 100).toFixed(0)}%  (${v.strictMax}/${v.n})`)
}
console.log(`\nWorst offenders (correct far longer than longest distractor):`)
offenders
  .sort((a, b) => b.gap - a.gap)
  .slice(0, 15)
  .forEach((o) => console.log(`  ${o.id}: +${o.gap} chars (correct ${o.correctLen} vs distractor ${o.longestDistractor})`))
