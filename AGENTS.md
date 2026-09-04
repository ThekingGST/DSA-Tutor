# AGENTS.md

## Session Setup

- **Scaffold (P0, P1, P2, P3, P4, P5 & P6 done + Multi-DSA Expanded):** `dsa-studio` — npm + Vite 8 + React 19 + TypeScript (`tsc -b && vite build`). Scripts: `dev` / `build` / `lint` (oxlint) / `test` / `preview` / `cleanup:browsers`. Deps: `@tldraw/tldraw` 5.4.0, tailwindcss 4.3.3 (v4 via `@tailwindcss/vite` plugin in `vite.config.ts`), lucide-react, clsx, tailwind-merge, canvas-confetti. P0-P6 complete: pure deterministic state folding (`timelineReducer.ts`), `useTimeline` state machine hook, custom TLDraw Array & Pointer shape, Linked List two-compartment node with magnetic pointer rewiring and three-compartment doubly-linked list (`[ <- prev | data | next -> ]`) with circular loop-back, BST circular node with deterministic `layoutTree` in-order coordinate solver and dynamic connectors, AVL tree balancing (LL/RR/LR/RL rotations, height, balance factors), Min/Max Heap with synchronized tree + array dual view, dedicated U-shaped Stack chamber (`StackShapeUtil`) with push/pop/peek operations and Top badge, horizontal Queue pipeline (`QueueShapeUtil`) with circular wrap-around indicator and modulo arithmetic, Graph BFS/DFS traversals reusing Queue/Stack primitives, Dijkstra shortest path with priority queue, sliding window max subarray sum, 2D DP table with state dependencies, recursion call stack frames, on-canvas Loop Tracker (`LoopTrackerShapeUtil`), on-canvas Variable Cards (`VariableCardsShapeUtil` / `dsa-variable-cards`) with full canvas pan/zoom, resize persistence, and direct-manipulation editing, array panel/space resize persistence across steps, draggable split pane workspace, Featherless AI Client (`FeatherlessClient`) + Storyboard Parser with `zai-org/GLM-5.3-Flash`, instant micro-command direct mutations, zero-fail procedural fallback generators, full AI Chat → Code + Visualization problem solver with manual code editing (`CodePanel`), multi-language support (Python, TypeScript, C++), conversational explanation thread (`ChatPanel`), and structured natural language DSA Intent Intermediate Representation (`dsaIntentParser.ts`) driving dynamic whiteboard canvas shape rendering across all scenarios. Comprehensive multi-case DSA validation suite. 180/180 unit tests passing across 24 suites in 589ms. Next: P7 Web Speech Audio Narration.
- **CLI via RTK:** prefix supported commands with `rtk` (e.g. `rtk git status`, `rtk ls`, `rtk grep`, `rtk find`, `rtk npm`, `rtk pnpm`, `rtk cargo`, `rtk docker`, `rtk test/lint/format`). Use `rtk gain` / `rtk gain --history` for savings, `rtk proxy <cmd>` when raw output is strictly needed. Auto-rewrite is configured in `.agents/hooks.json` via `rtk rewrite`; see `.agents/rules/antigravity-rtk-rules.md`.
- **Python via `uv` only:** use `uv run` / `uv add` for all Python (hooks, scripts). Never bare `pip`/`python3` for new tooling.
- **Browser & Testing Safety:** NEVER leave headless browser or devtools processes lingering. Prioritize ultra-fast native unit tests (`npm test`) and builds (`npm run build`). **WSL cannot use Playwright** (missing GUI/display libraries); any browser testing/screenshots MUST be executed in Windows (outside WSL) via host Chrome (`/mnt/c/Program Files/Google/Chrome/Application/chrome.exe`) or Windows Node with `< /dev/null`. When any browser automation/CDP is used, wrap it strictly in `try ... finally` with guaranteed teardown, and execute `npm run cleanup:browsers` post-test.
- **Vision source:** `Idea.md` is the product vision; this file is the build blueprint. Skills in `.agents/skills/` are pinned by `skills-lock.json` — load via the skill tool as needed.

---

# Project Blueprint: Visual DSA Teaching Platform ("DSA Studio")

**Goal:** 1st-prize interactive visual DSA teaching platform in 24h.

## 1. Core Stack (intent)

- **Framework:** React 19 + Vite + TypeScript.
- **Canvas:** TLDraw (`@tldraw/tldraw`), custom React shapes, Excalidraw-inspired styling.
- **Layout:** Split-screen — Left (35%): code editor with line highlight, AI prompt bar, Settings modal. Right (65%): TLDraw whiteboard (with on-canvas Variable Cards, DSA shapes) + bottom Timeline Player (Play/Pause, Step Next/Prev, Scrub, Speed).
- **AI:** Featherless API (`https://api.featherless.ai/v1`, OpenAI-compatible). Default `zai-org/GLM-5.3-Flash` (alt `Qwen/Qwen2.5-Coder-32B-Instruct`, `meta-llama/Meta-Llama-3.1-70B-Instruct`). Key via `.env.local` (`VITE_FEATHERLESS_API_KEY`) + Settings Gear modal.
- **Audio:** `window.speechSynthesis` behind an adapter seam (future ElevenLabs/OpenAI TTS fallback).

## 2. Canvas Shapes

All DSA elements are custom TLDraw shapes with direct-manipulation handles + programmatic AI APIs:

1. **Arrays & Pointers:** 1D slots with index indicators `[0..n-1]`. Double-click cell to edit inline; drag pointer badges (`i`, `j`, `pivot`, `left`, `right`, `mid`) to snap to cells. States: current, compared, sorted, swapped. In-place updates + swap animations.
2. **Linked Lists:** `[data | next ->]` nodes with magnetic ports and `[ <- prev | data | next -> ]` 3-compartment doubly-linked cards. Drag node to move with rubber-banding arrows; drag `next` or `prev` handles to detach/rewire. Circular linked list with return cycle.
3. **BST & AVL Trees:** deterministic auto-layout (level + subtree spacing), dynamic parent-child connectors. Ops: Insert, Search, Deletions, In-Order/Pre-Order/Post-Order/Level-Order traversals, Height and Balance Factor computation, LL/RR/LR/RL AVL rotations.
4. **Min/Max Heaps:** dual synchronized representation (tree hierarchy + flat array indices $2i+1$, $2i+2$) with sift-down and sift-up animations.
5. **Stack (LIFO):** U-shaped container chamber (`dsa-stack`) with open top, `TOP` pointer badge, push/pop/peek operations, capacity bounds, and inline cell editing.
6. **Queue & Circular Queue (FIFO):** horizontal conveyor pipeline (`dsa-queue`) with `FRONT` and `REAR` badges, wrap-around cycle path indicator, modulo index math, and enqueue/dequeue operations.
7. **Graphs & Networks:** node coordinates with edge weights, distance table badges, shortest path highlight trail, and priority queue coordination.
8. **Algorithmic Patterns:** 2D Dynamic Programming table with active cell dependency coordinates, Recursion Call Stack with stacked function frames and return values, and Sliding Window bounded range indicator.
9. **Variable Cards:** On-canvas sketched cards (`name = value`, e.g. `max = 10`, `secondMax = 5`) with pastel fills and hand-drawn borders. Double-click to edit name/value directly on the board; AI updates them smoothly with pulse highlights during playback.
10. **Loop Tracker:** floating card with loop header (`for i = 0 to n`), condition evaluation, iteration pills; human step controls synced to AI playback.

## 3. Dual Manipulation Model

Human and AI mutate the **same shape props through a shared reducer**: double-click slot ≡ `setSlot(index, val)` → `values[index]`; drag pointer `i` to cell 3 ≡ `movePointer('i', 3)` → `pointers['i'] = 3`; double-click variable card ≡ `setVariable(name, val)` → `variables[name] = val`.

## 4. Dual AI Patterns

- **Micro-commands (instant):** e.g. `create array [10, 20, 30]`, `insert 45 into tree`, `set max = 10` — spawn/mutate shapes without a full storyboard.
- **Macro-storyboards (code-to-board):** problem/code input → structured JSON Timeline per step: highlighted code line, on-canvas active vars (`max`, `secondMax`, `i`, `j`, …), canvas mutation (pointer move, highlight, swap), TTS narration text.

## 5. Golden Demos (zero-fail)

1. **QuickSort Partition** — dual `i`/`j` pointers, pivot variable card, swaps, line-by-line sync.
2. **Reverse Singly Linked List** — `prev`/`curr`/`next` rewiring mid-air.
3. **BST Insert & Search** — auto-layout branching, comparison stepping, node placement.

## 6. Playback Sync

Each timeline step drives all four together: (1) editor line highlight pulses, (2) on-canvas variable cards update and pulse, (3) canvas pointers/values transition, (4) voice narration explains reasoning.
