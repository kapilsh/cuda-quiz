// Standalone validator for the question bank — run with `npm run validate`.
// Useful in CI / pre-commit to catch malformed questions without a full build.

import { QUESTIONS, validateQuestions, questionStats } from '../src/data/questions/index.js'

const { ok, errors } = validateQuestions(QUESTIONS)
const stats = questionStats(QUESTIONS)

console.log(`Question bank: ${stats.total} questions`)
console.log('By category:', stats.byCategory)
console.log('By difficulty:', stats.byDifficulty)

if (!ok) {
  console.error(`\n✗ Validation failed with ${errors.length} error(s):`)
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}

console.log('\n✓ All questions valid.')
