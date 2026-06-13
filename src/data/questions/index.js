// Aggregates every per-category question file into one flat bank.
//
// To add a topic: create ./<topic>.js exporting defineQuestions('<topic>', [...]),
// register its category in ../categories.js, and import it below. Everything
// else (engine, store, UI, validation) picks it up automatically.

import { CATEGORY_BY_ID, MIN_DIFFICULTY, MAX_DIFFICULTY } from '../categories.js'

import basics from './basics.js'
import basicsB from './basics.b.js'
import basicsC from './basics.c.js'
import basicsD from './basics.d.js'
import basicsE from './basics.e.js'
import basicsF from './basics.f.js'
import memory from './memory.js'
import memoryB from './memory.b.js'
import memoryC from './memory.c.js'
import memoryD from './memory.d.js'
import memoryE from './memory.e.js'
import memoryF from './memory.f.js'
import execution from './execution.js'
import executionB from './execution.b.js'
import executionC from './execution.c.js'
import executionD from './execution.d.js'
import executionE from './execution.e.js'
import executionF from './execution.f.js'
import synchronization from './synchronization.js'
import synchronizationB from './synchronization.b.js'
import synchronizationC from './synchronization.c.js'
import synchronizationD from './synchronization.d.js'
import synchronizationE from './synchronization.e.js'
import synchronizationF from './synchronization.f.js'
import optimization from './optimization.js'
import optimizationB from './optimization.b.js'
import optimizationC from './optimization.c.js'
import optimizationD from './optimization.d.js'
import optimizationE from './optimization.e.js'
import optimizationF from './optimization.f.js'
import profiling from './profiling.js'
import profilingB from './profiling.b.js'
import profilingC from './profiling.c.js'
import profilingD from './profiling.d.js'
import profilingE from './profiling.e.js'
import profilingF from './profiling.f.js'
import architecture from './architecture.js'
import architectureB from './architecture.b.js'
import architectureC from './architecture.c.js'
import architectureD from './architecture.d.js'
import architectureE from './architecture.e.js'
import architectureF from './architecture.f.js'
import libraries from './libraries.js'
import librariesB from './libraries.b.js'
import librariesC from './libraries.c.js'
import librariesD from './libraries.d.js'
import librariesE from './libraries.e.js'
import librariesF from './libraries.f.js'
import multigpu from './multigpu.js'
import multigpuB from './multigpu.b.js'
import multigpuC from './multigpu.c.js'
import multigpuD from './multigpu.d.js'
import multigpuE from './multigpu.e.js'
import multigpuF from './multigpu.f.js'
import distributed from './distributed.js'
import distributedB from './distributed.b.js'
import distributedC from './distributed.c.js'
import distributedD from './distributed.d.js'
import distributedE from './distributed.e.js'
import distributedF from './distributed.f.js'
import streams from './streams.js'
import streamsB from './streams.b.js'
import streamsC from './streams.c.js'
import streamsD from './streams.d.js'
import streamsE from './streams.e.js'
import streamsF from './streams.f.js'
import precision from './precision.js'
import precisionB from './precision.b.js'
import precisionC from './precision.c.js'
import precisionD from './precision.d.js'
import precisionE from './precision.e.js'
import precisionF from './precision.f.js'

const FILES = [
  basics,
  basicsB,
  basicsC,
  basicsD,
  basicsE,
  basicsF,
  memory,
  memoryB,
  memoryC,
  memoryD,
  memoryE,
  memoryF,
  execution,
  executionB,
  executionC,
  executionD,
  executionE,
  executionF,
  synchronization,
  synchronizationB,
  synchronizationC,
  synchronizationD,
  synchronizationE,
  synchronizationF,
  optimization,
  optimizationB,
  optimizationC,
  optimizationD,
  optimizationE,
  optimizationF,
  profiling,
  profilingB,
  profilingC,
  profilingD,
  profilingE,
  profilingF,
  architecture,
  architectureB,
  architectureC,
  architectureD,
  architectureE,
  architectureF,
  libraries,
  librariesB,
  librariesC,
  librariesD,
  librariesE,
  librariesF,
  multigpu,
  multigpuB,
  multigpuC,
  multigpuD,
  multigpuE,
  multigpuF,
  distributed,
  distributedB,
  distributedC,
  distributedD,
  distributedE,
  distributedF,
  streams,
  streamsB,
  streamsC,
  streamsD,
  streamsE,
  streamsF,
  precision,
  precisionB,
  precisionC,
  precisionD,
  precisionE,
  precisionF,
]

export const QUESTIONS = FILES.flat()

// Lightweight integrity check. Runs once at import; throws in dev/build if a
// question is malformed so authoring mistakes surface immediately. Returns the
// validated list so callers can also invoke it explicitly (e.g. a CLI script).
export function validateQuestions(questions = QUESTIONS) {
  const seenIds = new Set()
  const errors = []

  for (const q of questions) {
    const where = q?.id ?? '(missing id)'
    if (!q || typeof q !== 'object') {
      errors.push(`Question ${where} is not an object`)
      continue
    }
    if (!q.id) errors.push(`Question is missing an id: ${JSON.stringify(q).slice(0, 80)}`)
    if (seenIds.has(q.id)) errors.push(`Duplicate id: ${q.id}`)
    seenIds.add(q.id)

    if (!CATEGORY_BY_ID[q.category]) {
      errors.push(`${where}: unknown category "${q.category}"`)
    }
    if (!Number.isInteger(q.difficulty) || q.difficulty < MIN_DIFFICULTY || q.difficulty > MAX_DIFFICULTY) {
      errors.push(`${where}: difficulty must be an integer ${MIN_DIFFICULTY}..${MAX_DIFFICULTY}, got ${q.difficulty}`)
    }
    if (typeof q.question !== 'string' || q.question.trim().length === 0) {
      errors.push(`${where}: empty question text`)
    }
    if (typeof q.correct !== 'string' || q.correct.trim().length === 0) {
      errors.push(`${where}: empty correct answer`)
    }
    if (!Array.isArray(q.distractors) || q.distractors.length < 1) {
      errors.push(`${where}: needs at least one distractor`)
    }
    const display = q.displayCount ?? 4
    if (!Number.isInteger(display) || display < 2) {
      errors.push(`${where}: displayCount must be an integer >= 2, got ${display}`)
    }
    // Must have enough distractors to fill the displayed option count.
    if (Array.isArray(q.distractors) && q.distractors.length < display - 1) {
      errors.push(
        `${where}: needs >= ${display - 1} distractors to show ${display} options, has ${q.distractors.length}`
      )
    }
    // All option texts (correct + distractors) must be distinct.
    if (typeof q.correct === 'string' && Array.isArray(q.distractors)) {
      const all = [q.correct, ...q.distractors]
      if (new Set(all).size !== all.length) {
        errors.push(`${where}: duplicate option text among correct/distractors`)
      }
    }
    if (typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      errors.push(`${where}: empty explanation`)
    }
  }

  return { ok: errors.length === 0, errors, count: questions.length }
}

export function questionsByDifficulty(questions = QUESTIONS) {
  const buckets = {}
  for (const q of questions) {
    ;(buckets[q.difficulty] ??= []).push(q)
  }
  return buckets
}

export function questionStats(questions = QUESTIONS) {
  const byCategory = {}
  const byDifficulty = {}
  for (const q of questions) {
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1
  }
  return { total: questions.length, byCategory, byDifficulty }
}

// Validate eagerly in dev so mistakes are loud; never crash the app in prod.
if (import.meta?.env?.DEV) {
  const { ok, errors } = validateQuestions()
  if (!ok) {
    console.error(`[cuda-quiz] Question bank validation failed:\n${errors.join('\n')}`)
  }
}
