// Category metadata for the question bank.
//
// Categories are stable identifiers used as the prefix of every question id
// (e.g. "memory-014"). Adding a new category = add an entry here + a file in
// ./questions and register it in ./questions/index.js. Nothing else needs to
// change for the app to scale to thousands of questions.

export const CATEGORIES = [
  {
    id: 'basics',
    label: 'CUDA Basics & Programming Model',
    short: 'Basics',
    color: '#76b900', // NVIDIA green
    blurb: 'Threads, blocks, grids, kernels, host vs. device, the execution model.',
  },
  {
    id: 'memory',
    label: 'Memory Hierarchy',
    short: 'Memory',
    color: '#36c5f0',
    blurb: 'Global, shared, constant, registers, local memory, coalescing.',
  },
  {
    id: 'execution',
    label: 'Execution & Scheduling',
    short: 'Execution',
    color: '#8a5cf6',
    blurb: 'Warps, SIMT, divergence, occupancy, the SM, scheduling.',
  },
  {
    id: 'synchronization',
    label: 'Synchronization & Atomics',
    short: 'Sync',
    color: '#f2994a',
    blurb: 'Barriers, __syncthreads, atomics, memory fences, races.',
  },
  {
    id: 'optimization',
    label: 'Kernel Optimization',
    short: 'Optimize',
    color: '#eb5757',
    blurb: 'Tiling, bank conflicts, ILP, vectorized loads, loop unrolling.',
  },
  {
    id: 'profiling',
    label: 'Performance & Profiling',
    short: 'Profiling',
    color: '#27ae60',
    blurb: 'Roofline, Nsight Systems/Compute, throughput vs. latency bound.',
  },
  {
    id: 'architecture',
    label: 'GPU Architecture',
    short: 'Arch',
    color: '#bb6bd9',
    blurb: 'SM internals, tensor cores, async copy, TMA, Ampere/Hopper/Blackwell.',
  },
  {
    id: 'libraries',
    label: 'Libraries: cuBLAS, CUTLASS, CuTe',
    short: 'Libraries',
    color: '#2d9cdb',
    blurb: 'cuBLAS, cuDNN, Thrust, CUB, CUTLASS, CuTe layouts and abstractions.',
  },
  {
    id: 'multigpu',
    label: 'Multi-GPU & NCCL',
    short: 'Multi-GPU',
    color: '#f2c94c',
    blurb: 'Collectives, all-reduce, ring/tree algorithms, NVLink, P2P, NCCL.',
  },
  {
    id: 'distributed',
    label: 'Distributed Training',
    short: 'Distributed',
    color: '#ff7a59',
    blurb: 'Data/tensor/pipeline parallelism, ZeRO, FSDP, overlap, sharding.',
  },
  {
    id: 'streams',
    label: 'Streams, Events & Graphs',
    short: 'Streams',
    color: '#56ccf2',
    blurb: 'Streams, events, concurrency, CUDA Graphs, overlap of copy/compute.',
  },
  {
    id: 'precision',
    label: 'Numerics & Mixed Precision',
    short: 'Precision',
    color: '#9b51e0',
    blurb: 'FP32/TF32/FP16/BF16/FP8, accumulation, scaling, numerical stability.',
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
)

// Difficulty scale shared across the app. The adaptive engine works on a
// continuous skill estimate but questions are tagged with integer levels.
export const DIFFICULTY_LEVELS = [
  { level: 1, label: 'Beginner', blurb: 'Core programming model & terminology.' },
  { level: 2, label: 'Easy', blurb: 'Everyday CUDA C and basic memory.' },
  { level: 3, label: 'Intermediate', blurb: 'Optimization patterns & scheduling.' },
  { level: 4, label: 'Advanced', blurb: 'Architecture-aware kernels & scaling.' },
  { level: 5, label: 'Expert', blurb: 'Cutting-edge kernels & distributed systems.' },
]

export const MIN_DIFFICULTY = 1
export const MAX_DIFFICULTY = 5
