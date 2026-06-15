# CUDA Quiz

An adaptive, client-side CUDA quiz website. Multiple-choice questions on CUDA
programming, GPU architecture, and the modern ML-systems stack (tensor cores,
NCCL, FSDP/ZeRO, FlashAttention, FP8/FP4, Hopper/Blackwell, TMA, wgmma, …).
Honor-system, no backend, designed to scale to ~2000 questions.

Live: **https://kapilsharma.dev/cuda-quiz**

---

## Tech stack

- **Vite 7 + React 19 + Zustand 5**, client-side only (no database, no server).
- Builds to **`docs/`** with base **`/cuda-quiz/`** for GitHub Pages.
- Deployed via **GitHub Actions** (`.github/workflows/deploy.yml`) on push to
  `main`. Pages source = "GitHub Actions"; repo must be public on the free tier.
  Fastly CDN gzip/brotli-compresses the JS automatically.

## Commands

```bash
npm run dev        # local dev server
npm run build      # build to docs/  (base /cuda-quiz/)
npm run preview    # preview the production build
npm run validate   # validate the question bank (scripts/validateQuestions.mjs)
npm run lint       # eslint
```

`docs/` and `dist/` are gitignored; the Actions workflow builds and publishes.

## How it works

- **~1937 questions** across **12 topics × 6 rounds (A–F)** = 72 question files
  in `src/data/questions/`.
- **Adaptive difficulty**: skill estimate rises on correct answers, falls on
  wrong ones; the engine samples the next question from a difficulty band with
  no-repeat (`src/engine/adaptiveEngine.js`).
- **Question pooling**: each question stores a `correct` answer plus a pool of
  `distractors`. At serve time `buildOptions` samples `correct + (displayCount-1)`
  distractors and **shuffles** them, so option order/set varies per user/replay.
  Default `displayCount` = 4.
- **The landing page must NOT show the question count** — it's a deliberate
  surprise. Don't add a total-questions counter to the landing UI.

## Key files

| File | Purpose |
|------|---------|
| `src/data/questions/_helpers.js` | `defineQuestions(category, records, opts)` — expands compact records `{d,q,o,a,x,pick,e,ref,tags}` into full question objects. `a` is the index into `o` of the correct option; `x` are extra distractors; `pick` overrides `displayCount`. |
| `src/data/questions/index.js` | Imports all 72 files, exports flat `QUESTIONS`, plus `validateQuestions()` and `questionStats()`. |
| `src/engine/adaptiveEngine.js` | `ENGINE_CONFIG`, `updateSkill`, `selectNextQuestion`, `buildOptions`. |
| `src/store/quizStore.js` | Zustand store; serves current options/answer, persists lifetime stats (not which questions were seen). |
| `src/data/questions/<cat>{,.b,.c,.d,.e,.f}.js` | 72 files. Each `export default defineQuestions('<cat>', [...], { idPrefix: '<cat>-<round>' })`. Per-file `idPrefix` avoids ID collisions across rounds. |
| `vite.config.js` | base `/cuda-quiz/`, `outDir: 'docs'`, vendor chunk split. |
| `.github/workflows/deploy.yml` | GitHub Pages deploy. Node 22; opts JS actions into Node 24 runtime via `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`. |

### Question record shape (compact form)

```js
{
  d: 3,                       // difficulty 1–5
  q: 'Question text?',
  o: ['opt A', 'opt B', ...], // visible options (correct is at index `a`)
  a: 1,                       // index of the correct option in `o`
  x: ['extra distractor', …], // optional extra distractors for the pool
  pick: 4,                    // optional displayCount override
  e: 'Explanation shown after answering.',
  ref: 'Source citation',
  tags: ['warp', 'simt'],
}
```

The 12 categories: `basics, memory, execution, synchronization, optimization,
profiling, architecture, libraries, multigpu, distributed, streams, precision`.

---

## ⚠️ ACTIVE TASK — "concise correct options" rewrite (IN PROGRESS)

### The problem
A measurement found a severe answer-position tell: **~95% of questions had the
correct answer as the strictly longest option** (mean correct length ~132 chars
vs ~18 for distractors). A test-taker could just pick the longest option and win.

### The fix (chosen & confirmed by the user)
**Shorten over-long correct options** to terse phrases comparable in length to
the (already-short) distractors. The full detail moves into / stays in the `e`
(explanation) field. **Distractors and explanations are left untouched.** This is
a manual, per-question rewrite across all 72 files (~1850 correct options).

### Success metric — use the "obvious gap", NOT "strict longest"
Don't chase the `strict-longest` percentage — it stays high (~70%) even when
fixed, because distractors are ~15 chars and a correct answer that genuinely
needs ~25 chars is unavoidably "longest" by a hair. That is fine and not
exploitable. The metric that matters:

```
gap = correct.length − max(distractor lengths)
obvious = gap > 25      # a reader can SEE it's longer
```

**Target: ~0% obvious, mean gap < ~15 chars per category.** Aim each rewritten
correct option to be within ~25 chars of the longest distractor (ideally <15).

Quick per-category check:

```bash
node --input-type=module -e '
import { QUESTIONS } from "./src/data/questions/index.js";
for (const cat of ["basics","memory","execution","synchronization","optimization",
  "profiling","architecture","libraries","multigpu","distributed","streams","precision"]) {
  const qs = QUESTIONS.filter(q=>q.category===cat);
  let obvious=0, gaps=[];
  for (const q of qs){const m=Math.max(...q.distractors.map(d=>d.length));
    const g=q.correct.length-m; gaps.push(g); if(g>25)obvious++;}
  gaps.sort((a,b)=>a-b);
  console.log(`${cat}: obvious=${obvious}/${qs.length} meanGap=${(gaps.reduce((a,b)=>a+b,0)/gaps.length).toFixed(1)}`);
}'
```

Other diagnostics: `scripts/analyzeOptions.mjs` (strict-longest %, worst
offenders), `scripts/analyzeSeparators.mjs`, `scripts/simTrim.mjs` (these proved
no automated trim suffices — it must be a manual rewrite).

### Progress

| Category | Files | Status | Result |
|----------|-------|--------|--------|
| basics | basics{,.b,.c,.d,.e,.f}.js | ✅ DONE | 0% obvious, meanGap 7.4 |
| memory | memory{,.b,.c,.d,.e,.f}.js | ✅ DONE | 0% obvious, meanGap 10.9 |
| execution | execution{,.b–f}.js | ✅ DONE | 0% obvious, meanGap 12.0 |
| synchronization | …{,.b–f}.js | ✅ DONE | 0% obvious, meanGap 14.7 |
| optimization | …{,.b–f}.js | ✅ DONE | 0% obvious, meanGap 14.0 |
| profiling | …{,.b–f}.js | ✅ DONE | 0% obvious, meanGap 14.4 |
| architecture | …{,.b–f}.js | ✅ DONE | 0% obvious, meanGap 15.4 |
| libraries | …{,.b–f}.js | ✅ DONE | 0% obvious, meanGap 15.3 |
| multigpu | …{,.b–f}.js | ✅ DONE | 0% obvious, meanGap 19.8 |
| distributed | …{,.b–f}.js | ⏳ NEXT | |
| streams | …{,.b–f}.js | ⬜ pending | |
| precision | …{,.b–f}.js | ⬜ pending | |

**54 of 72 files done (9 categories). 18 files remain.**

### Method (per file)
1. **Read the whole file** (~550 lines). The harness sometimes drops Read-state;
   if an Edit returns "File has not been read yet," just re-Read it.
2. For each question, look at the correct option = `o[a]`. If it's clearly longer
   than the distractors (obvious gap > ~25), rewrite it to a terse phrase.
   Skip ones already short (numeric answers, single API names, short phrases).
3. Issue **all edits for the file in one batch** (many `Edit` calls in one turn).
   `old_string` = the exact current correct-option text (mind curly `'`, arrows
   `→ ↔ ×`, em-dashes `—`); `new_string` = the concise version.
4. **Do not touch** distractors or the `e`/`ref`/`tags` fields.
5. After a category, run `npm run validate` (catches a shortened correct that
   accidentally collides with a distractor) and the obvious-gap snippet above.

### Rewrite style examples (correct option → concise)
- `'A function that runs on the GPU and is executed by many threads in parallel'`
  → `'A GPU function run by many threads in parallel'`
- `'Distributed Shared Memory (DSMEM) via the SM-to-SM network within a thread block cluster'`
  → `'Distributed Shared Memory (DSMEM)'`
- `'cudaGetErrorName returns the symbolic enum name (e.g. "…"); cudaGetErrorString returns the prose description'`
  → `'Name → the enum identifier; String → the prose'`

### When the whole pass is done
1. Run `npm run validate` → must print "✓ All questions valid."
2. Run the obvious-gap snippet → every category should read ~0% obvious.
3. Tell the user — **they commit & push themselves** (see below).

---

## Working conventions / preferences

- **Git is the user's job.** Do NOT run `git commit` / `git push`. The user runs
  git themselves and has repeatedly taken it over. Make the file changes; let
  them commit and push (which triggers the redeploy).
- Keep the **question count off the landing page**.
- Match the existing terse, citation-backed style when adding/editing questions.
- The bundle is already minified + CDN-compressed; no extra compression work
  needed.
