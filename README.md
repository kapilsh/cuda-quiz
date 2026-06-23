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

## Working conventions / preferences

- **Git is the user's job.** Do NOT run `git commit` / `git push`. The user runs
  git themselves and has repeatedly taken it over. Make the file changes; let
  them commit and push (which triggers the redeploy).
- Keep the **question count off the landing page**.
- Match the existing terse, citation-backed style when adding/editing questions.
- The bundle is already minified + CDN-compressed; no extra compression work
  needed.
