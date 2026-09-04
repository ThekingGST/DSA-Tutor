# DSA Studio — Comprehensive Build Plan

**Target:** 1st-Prize Winning Interactive Visual DSA Teaching & Explanation Platform in 24 Hours.  
**Vision Source:** [Idea.md](file:///home/thekinggst/projects/DSA-Notebook/Idea.md)  
**Blueprint Source:** [AGENTS.md](file:///home/thekinggst/projects/DSA-Notebook/AGENTS.md)

---

## 1. Executive Summary & Pitch Hook

Traditional DSA visualizers (e.g. VisuAlgo) are rigid, pre-rendered, read-only animations. Whiteboard tools (e.g. Excalidraw, Miro) have no algorithmic semantics. 

**DSA Studio** bridges both worlds:
- An **infinite whiteboard** powered by TLDraw where every shape (Array, Node, Pointer, Loop) is a living, interactive semantic component.
- A **dual-manipulation model**: both the human instructor (mouse, keyboard, drag) and the AI agent (via Featherless LLM) mutate the exact same underlying state representation.
- A **synchronized 4-way multimedia engine**: every algorithmic step animates the canvas, highlights the corresponding code line, updates the variable watch table, and narrates the instructor's reasoning aloud.

---

## 2. System Architecture & Component Tree

The interface is structured as a **35% / 65% split-screen studio**:

```
+----------------------------------------------------------------------------------------------------+
|                                    DSA STUDIO HEADER / NAV                                         |
|  [Presets: QuickSort | Reverse List | BST Insert]   [Theme]   [Mute/Audio]   [Settings ⚙️]         |
+------------------------------------------+---------------------------------------------------------+
| LEFT PANEL (35%)                         | RIGHT PANEL (65%)                                       |
|                                          |                                                         |
| 1. Code Editor (Monaco / Custom Editor)  | 1. TLDraw Whiteboard Canvas                             |
|    - Active execution line glowing pulse |    - Semantic Shapes: Array, Linked List, BST           |
|    - Syntax highlighted (Py / TS / C++)  |    - On-Canvas Variable Cards:                          |
|                                          |      ┌──────────────┐   ┌────────────────────┐          |
| 2. Smart AI Prompt & Command Bar         |      │  max = 10    │   │   secondMax = 5    │          |
|    - Micro-commands ("create array ...") |      └──────────────┘   └────────────────────┘          |
|    - Macro-prompts ("Explain Two Sum...")|    - Loop Tracker Floating Card                      |
|    - Instant generation status           |    - Direct manipulation handles (drag pointers, edit)  |
|                                          |    - Excalidraw-style sketchy borders & handwriting font|
|                                          |                                                         |
|                                          | 2. Bottom Floating Timeline Player HUD                  |
|                                          |    - [⏮ Prev] [▶ Play / ⏸ Pause] [⏭ Next] [↺ Reset]      |
|                                          |    - Interactive Scrub Bar with Step Markers            |
|                                          |    - Speed Toggle (0.5x, 1x, 1.5x, 2x)                  |
|                                          |    - Current Step Narration Subtitle Banner             |
+------------------------------------------+---------------------------------------------------------+
```

---

## 3. Data Contracts & State Management

### 3.1 The Invariant
> **Human gesture ≡ AI programmatic mutation.**  
> - Human double-clicks slot $k$ and types `42` $\equiv$ AI executes `setSlot(k, 42)`.
> - Human drags pointer badge $i$ to slot $k$ $\equiv$ AI executes `movePointer('i', k)`.
> - Human rewires node arrow from $B$ to $A$ $\equiv$ AI executes `setNext(nodeB, nodeA)`.

### 3.2 The Core Timeline Schema (`TimelineStep`)
The entire playback engine is driven by a deterministic array of steps:

```typescript
export type PointerMap = Record<string, number | string | null>; // pointer name -> slot index or node id
export type HighlightState = 'default' | 'active' | 'comparing' | 'sorted' | 'swapped' | 'visited';

export interface CanvasMutation {
  type: 'array' | 'linked-list' | 'bst' | 'loop' | 'variable';
  targetId: string;
  action: 
    | { kind: 'set-slot'; index: number; value: number | string }
    | { kind: 'swap-slots'; indexA: number; indexB: number }
    | { kind: 'move-pointer'; name: string; toIndex: number | string }
    | { kind: 'highlight-slots'; indices: number[]; state: HighlightState }
    | { kind: 'connect-nodes'; fromId: string; toId: string | null }
    | { kind: 'insert-tree-node'; value: number; parentId?: string; branch?: 'left' | 'right' }
    | { kind: 'highlight-tree-node'; nodeId: string; state: HighlightState }
    | { kind: 'update-loop'; iteration: number; conditionText: string; isComplete?: boolean };
}

export interface TimelineStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  codeLine: number;                       // Line number in code editor to pulse/highlight
  variables: Record<string, string | number>; // e.g. { i: 2, j: 4, pivot: 25 }
  narration: string;                      // Instructor voiceover text for speech synthesis
  mutations: CanvasMutation[];            // Atomic mutations applied in this step
}
```

---

## 4. Custom TLDraw Shape Specifications

### 4.1 `ArrayShape` (`dsa-array`)
- **Visual:** Horizontal sequence of rounded slot cards with 1-based or 0-based indices beneath.
- **Interactive Handles:**
  - **Slot Value:** Double-click cell to open inline input; press Enter to commit.
  - **Pointer Badges:** Floating pill badges ($i, j, left, right, pivot, mid$) rendered above/below slots. Dragging a badge snaps to nearest cell center.
  - **Quick Add/Remove:** Hovering the end of the array exposes a `+` button to push an element.
- **Visual States:** Color accents for `comparing` (amber), `swapped` (fuchsia), `sorted` (emerald), `active` (indigo).

### 4.2 `LinkedListNodeShape` (`dsa-linked-node`)
- **Visual:** Classic two-compartment card `[ data | ●-> ]`.
- **Interactive Handles:**
  - `data` partition is double-click editable.
  - `next` partition contains an interactive connection port. Dragging the port pulls a magnetic rubber-banding TLDraw arrow.
  - Dropping the arrow near another node's input port attaches and establishes `next` linkage.
  - Mid-air detachment allows teaching pointer reversal (`prev`, `curr`, `next`).

### 4.3 `BSTNodeShape` & Layout Engine (`dsa-tree-node`)
- **Visual:** Circular node badges with value, glowing traversal halo, and child pointer connectors.
- **Deterministic Auto-Layout Utility (`layoutTree`):**
  - Recursive coordinate solver: computes $(x, y)$ positions based on subtree widths and level depths.
  - Ensures zero edge crossing and no node overlapping.
  - Dynamic smooth bezier or straight TLDraw arrows connecting parent to left/right children.
- **Operations:** Insert animation (root traversal down to leaf), Search animation (glow trail along comparison path).

### 4.4 `LoopTrackerShape` (`dsa-loop-tracker`)
- **Visual:** Floating glassmorphism card on canvas.
- **Contents:**
  - Loop header (e.g. `for (let i = 0; i < n; i++)`).
  - Condition evaluation (e.g. `i < 5 => 2 < 5 is TRUE`).
  - Iteration pills: `[0] [1] [● 2] [3] [4]`.
  - Manual step button for the teacher to advance without AI.

---

## 5. AI Engine: Featherless API Integration

### 5.1 Configuration
- **Base URL:** `https://api.featherless.ai/v1` (OpenAI-compatible).
- **Default Model:** `Qwen/Qwen2.5-Coder-32B-Instruct` (fallback: `meta-llama/Meta-Llama-3.1-70B-Instruct`).
- **Key Retrieval:** `import.meta.env.VITE_FEATHERLESS_API_KEY` + Settings Gear modal with `localStorage` persistence.

### 5.2 Dual Intent Routing

```
                          User Input Prompt / Code
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       [Micro-Command Detected?]               [Macro-Storyboard Request]
   (e.g. "create array [10, 20]",          (e.g. "Explain QuickSort partition",
    "insert 42 into tree", "add ptr i")     or pasted arbitrary code snippet)
                 │                                       │
                 ▼                                       ▼
       Direct Atomic Mutation              Featherless LLM with Strict JSON
      Instant Shape Spawn / Edit               Timeline Schema Generation
                 │                                       │
                 ▼                                       ▼
       Canvas Updated (<50ms)                  Zod Schema Validation & Repair
                                                         │
                                                         ▼
                                               Load into Timeline Player
                                               (Play, Scrub, Audio Sync)
```

### 5.3 Resilience & Fallback Guardrails
1. **Zero-Crash Schema Parsing:** If LLM returns malformed JSON or markdown backticks, run automated regex cleanup and JSON extraction.
2. **Preset Fallback:** If API call fails or times out (rate limits, bad WiFi), smoothly fall back to the nearest pre-compiled golden demo with an alert toast.

---

## 6. Audio Engine: The Synthetic Teacher

- **Default Implementation:** Native Web Speech API (`window.speechSynthesis`).
  - Zero external dependencies, zero latency, offline capable.
  - Automatically picks modern natural voices (`Google UK English Male`, `Samantha`, etc.).
- **Synchronized Playback Lifecycle:**
  - Step transitions trigger `speechSynthesis.speak(step.narration)`.
  - Seeking or scrubbing immediately halts current speech (`speechSynthesis.cancel()`).
  - Global Mute/Unmute toggle stored in state and navbar.
- **Seam for Future Providers:** Audio interface encapsulated behind `AudioNarrationAdapter` (can swap to ElevenLabs or OpenAI TTS with zero changes to timeline components).

---

## 7. Golden Demos (Zero-Fail Offline Showcase)

Three hand-crafted, pixel-perfect demonstration scripts bundled directly in the codebase:

1. **QuickSort Partitioning (`quicksort-demo.ts`)**:
   - Array: `[29, 10, 14, 37, 13]`, pivot = `13`.
   - Dual pointers $i$ and $j$ scanning and swapping elements.
   - Code lines synchronized with classic Lomuto partition function.
   - Narration explaining pivot selection, condition checks, and final swap into place.
2. **Reverse a Singly Linked List (`reverse-list-demo.ts`)**:
   - Nodes: `[1] -> [2] -> [3] -> [4] -> NULL`.
   - Pointers `prev`, `curr`, `next` tracking each node.
   - Dynamic mid-air rewiring of `curr.next` backwards to `prev`.
3. **BST Insert & Search (`bst-demo.ts`)**:
   - Root `50`, children `30`, `70`, `20`, `40`.
   - Stepping through insert of `35`: comparing with `50` (left), comparing with `30` (right), comparing with `40` (left leaf insertion).
   - Auto-layout recalculating positions with glow trail.

---

## 8. Phase-by-Phase Build Roadmap (24-Hour Horizon)

```
[P0: Scaffold & Setup]  -->  [P1: Split Studio Shell]  -->  [P2: Timeline Engine]
                                                                     │
[P5: AI Featherless API] <--  [P4: Linked List & BST]  <--  [P3: Array TLDraw Shape]
         │
         ▼
[P6: Web Speech Audio]  -->  [P7: Golden Fixtures]    -->  [P8: Hackathon Polish]
```

### Phase 0: Scaffolding & Dependencies (Hour 0 - 2) — DONE
- [x] Initialize React 19 + Vite + TypeScript project.
- [x] Install dependencies: `@tldraw/tldraw`, `lucide-react`, `tailwindcss`, `clsx`, `tailwind-merge`, `canvas-confetti`.
- [x] Configure Tailwind, fonts (Inter + Fira Code / JetBrains Mono), and dark/light color palette.
- [x] Configure `.env.local` with `VITE_FEATHERLESS_API_KEY` placeholder.
- [x] *Done Criteria:* `rtk npm run dev` runs with clean console and zero errors.
- Verified: `npm run build` (tsc -b + vite) passes; dev serves HTTP 200 with no errors. Pinned: react 19.2.8, vite 8.2.2, typescript ~6.0.2, `@tldraw/tldraw` 5.4.0, tailwindcss 4.3.3 (v4 via `@tailwindcss/vite`), lucide-react 1.40.0, clsx 2.1.1, tailwind-merge 3.6.0, canvas-confetti 1.9.4. Package name `dsa-studio`.

### Phase 1: Studio Shell & Layout (Hour 2 - 4) — DONE
- [x] Implement responsive 35% / 65% split-screen layout.
- [x] Build left panel: Code Editor wrapper with line highlighting, and Prompt Bar.
- [x] Build right panel: Mount basic TLDraw canvas, on-canvas Variable Cards (`max = 10`, `secondMax = 5`), and Bottom Timeline Player HUD.
- [x] Build top navigation bar: Demo presets selector (QuickSort, Reverse List, BST), Audio mute toggle, Settings modal.
- [x] *Done Criteria:* Shell renders with mock data; changing mock props updates line highlights, variable cards, and timeline player.
- Verified: Built Header, CodePanel, PromptBar, WhiteboardCanvas, TimelinePlayer HUD, SettingsModal. `npm test` passes (5/5 tests in 15ms), `npm run lint` passes (0 errors/warnings), `npm run build` passes (tsc -b && vite in 971ms). Dev server verified responding HTTP 200 on port 5173.

### Phase 2: Timeline Engine & Reducer (Hour 4 - 6) — DONE
- [x] Define TypeScript types: `TimelineStep`, `CanvasMutation`, `PointerMap`, `HighlightState`, `CanvasEntities`.
- [x] Implement pure state reducer: `applyCanvasMutation`, `applyTimelineStep`, `computeTimelineState` (deterministic fold).
- [x] Implement `useTimeline` hook: state machine managing `currentStepIndex`, `currentStep`, `isPlaying`, `speed`, `canvasState`, `play()`, `pause()`, `stepNext()`, `stepPrev()`, `seekTo()`, `reset()`, `setSpeed()`.
- [x] *Done Criteria:* Hook advances through scenarios; Play/Pause/Scrub controls respond smoothly; pure reducer computes swaps, pointer movements, tree insertions, and variable cards deterministically.
- Verified: Created `src/types/timeline.ts`, `src/core/timelineReducer.ts`, and `src/core/useTimeline.ts`. Wired into `App.tsx` and `WhiteboardCanvas.tsx`. 19/19 unit tests passing across 3 test suites (`tests/*.test.ts` in 150ms). `npm run lint` passes (0 errors/warnings). `npm run build` passes cleanly. Verified in headless Windows Chrome: QuickSort swaps slots `[29, 10] -> [10, 29]` at step 2 with `swapped` highlighting, and places pivot `13` at sorted index 1 at step 5.

### Phase 3: Array & Pointer TLDraw Custom Shape (Hour 6 - 9) — DONE
- [x] Create `ArrayShapeUtil` extending TLDraw `BaseBoxShapeUtil`.
- [x] Implement slot grid with indices $[0 \dots n-1]$ and pre-array $[-1]$ start slot.
- [x] Implement inline double-click editing of slot values (`values[i]`).
- [x] Implement draggable and clickable pointer badges ($i, j, pivot, left, right, mid$) with magnetic snapping to array cells.
- [x] Add visual states: comparing (amber), swapped (fuchsia), sorted (emerald), active (indigo) animations and borders.
- [x] *Done Criteria:* Array can be directly manipulated by mouse/keyboard; programmatic calls to `movePointer` and `swap` transition visually.
- Verified: Created `src/canvas/shapes/ArrayShapeUtil.ts`, `ArrayComponent.tsx`, and `arrayShapeLogic.ts`. Registered in `WhiteboardCanvas.tsx` via `shapeUtils={[ArrayShapeUtil]}` with `maxFontsToLoadBeforeRender: 0` for instant canvas readiness. 28/28 unit tests passing across 4 test suites (`tests/*.test.ts` in 160ms). `npm run lint` (`oxlint`) passes with 0 warnings/0 errors. `npm run build` (`tsc -b && vite build`) passes in 1.06s. Visual verification in Windows Chrome: QuickSort partition step 0 (ghost `[-1]` cell with $i=-1$, $j=0$, $pivot=4$), step 2 (swap $[29, 10] \to [10, 29]$ with fuchsia highlights), and step 5 (pivot 13 permanently sorted at index 1).

### Phase 4: Linked List & BST Custom Shapes (Hour 9 - 13) — DONE
- [x] Create `LinkedListNodeShapeUtil`: card with data and `next` port.
- [x] Implement magnetic wire connections for node pointers with rubber-band dragging.
- [x] Create `BSTNodeShapeUtil`: circular node with value and glowing traversal halo.
- [x] Implement `layoutTree(nodes, rootId)` utility: mathematical coordinate positioning with subtree width calculation.
- [x] Dynamic connector lines linking parent to children.
- [x] *Done Criteria:* Reverse linked list pointers can be dragged by hand; BST auto-arranges cleanly on insertion.
- Verified: Created `LinkedListNodeShapeUtil.ts`, `LinkedListComponent.tsx`, `linkedListLogic.ts`, `BSTNodeShapeUtil.ts`, `BSTNodeComponent.tsx`, and `treeLayoutLogic.ts`. Registered all custom shapes in `WhiteboardCanvas.tsx` with dynamic SVG connectors for node wires and tree branches. 41/41 unit tests passing across 6 suites (`tests/*.test.ts` in 188ms). `npm run lint` (`oxlint`) passes with 0 warnings/0 errors. `npm run build` (`tsc -b && vite build`) passes in 610ms. Visual verification in Windows Chrome: Reverse Linked List step 0 (initial list with curr pointer), step 2 (mid-air pointer detachment/rewiring to null), step 4 (fully reversed list); BST Insert step 0 (root 50 active with subtrees 30 and 70), step 3 (Node 35 inserted and dynamically attached to Node 40 with auto-recalculated layout).

### Phase 5: Loop Tracker & Variable Watcher (Hour 13 - 15) — DONE
- [x] Create `LoopTrackerShapeUtil`: floating canvas widget with condition text and iteration pill stepper.
- [x] Wire Loop Tracker to `TimelineStep` updates so pills highlight as the algorithm loops.
- [x] Connect left-panel Variable Watcher to canvas shapes for synchronized updates.
- [x] *Done Criteria:* Stepping through a loop highlights code line, updates $i$ in table, pulses array pointer, and advances loop pill.
- Verified: Created `src/canvas/shapes/LoopTrackerShapeUtil.ts`, `LoopTrackerComponent.tsx`, `loopTrackerLogic.ts`, `src/components/code/VariableWatcher.tsx`, and `src/core/variableWatcherLogic.ts`. Pure reducer supports `set-loop`, `remove-loop`, and `update-loop` actions. Bi-directional manipulation wired: clicking pills or steppers on canvas emits `dsa:loop-step` to seek timeline; stepping timeline synchronizes iteration pills, condition banners (evaluating/true/false/done), and variable watcher deltas. 53/53 unit tests passing across 8 suites (`tests/*.test.ts`). `npm run lint` (`oxlint`) passes with 0 warnings/0 errors. `npm run build` (`tsc -b && vite build`) passes in 5.54s. Visual verification in Windows Chrome: QuickSort partition step 0 (0% progress, evaluating condition, j=0 pill active), QuickSort partition step 2 (swap match, 25% progress, j=0 completed, j=1 active, Variable Watcher highlighting delta `prev: -1` and `prev: 0` with lightning badges), Reverse Linked List step 0 (while loop tracker with Node pills and curr/prev variable tracking).

### Phase 6: Featherless AI Client & Storyboard Parser (Hour 15 - 18)
- [ ] Create `FeatherlessClient` using standard `fetch` against `https://api.featherless.ai/v1/chat/completions`.
- [ ] System prompt engineering: instructs `Qwen/Qwen2.5-Coder-32B-Instruct` to output valid `TimelineStep[]` JSON.
- [ ] Implement Micro-Command parser: detects prompts like `"create array [5, 2, 8]"` and spawns shapes immediately.
- [ ] Implement Macro-Storyboard parser: takes problem description or code and generates full timeline.
- [ ] Add JSON extraction, regex sanitization, and fallback to pre-baked fixtures on failure.
- [ ] *Done Criteria:* Typing "create array [10, 20, 30]" spawns array; typing "find max element" generates playable timeline.

### Phase 7: Web Speech Audio Narration (Hour 18 - 20)
- [ ] Implement `WebSpeechAdapter` wrapping `window.speechSynthesis`.
- [ ] Synchronize narration trigger with `useTimeline` step changes.
- [ ] Handle seek, pause, and step cancelation cleanly.
- [ ] Add voice selector and Mute toggle in UI header.
- [ ] *Done Criteria:* Stepping through timeline speaks explanation; pausing or scrubbing silences audio instantly.

### Phase 8: Golden Demo Fixtures & Zero-Fail Mode (Hour 20 - 22)
- [ ] Finalize `quicksort-demo.ts` with line-by-line sync and narration.
- [ ] Finalize `reverse-list-demo.ts` with pointer rewiring animation.
- [ ] Finalize `bst-demo.ts` with tree traversal and insertion.
- [ ] Wire header preset buttons to immediately load each fixture with zero network delay.
- [ ] *Done Criteria:* All 3 demos run 100% offline, flawlessly on demand.

### Phase 9: Design Polish, Shortcuts & Dry Run (Hour 22 - 24)
- [ ] Add keyboard shortcuts: Space (Play/Pause), Left Arrow (Prev), Right Arrow (Next), R (Reset).
- [ ] Excalidraw-style aesthetics: warm border sketches, curated modern color palette (slate/indigo/amber/emerald).
- [ ] Confetti celebration on algorithm completion!
- [ ] Run full production build: `rtk npm run build` and test production preview.
- [ ] 3-minute hackathon pitch rehearsal with stopwatch.

---

## 9. Risk Matrix & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **TLDraw shape learning curve** | High | Start with `ArrayShape` only in Phase 3. Once that pattern is proven, `LinkedList` and `BST` reuse the exact same container & handle lifecycle. |
| **Featherless LLM latency or malformed JSON** | High | 1) Provide strict JSON schema with few-shot examples in system prompt. 2) Fall back instantly to Golden Demo presets so live pitch to judges never stalls. |
| **Audio synchronization drifting** | Medium | Keep narrations short (1-2 sentences per step). Explicitly call `speechSynthesis.cancel()` on any step transition. |
| **Canvas coordinate chaos during live generation** | Medium | Use fixed origin anchors (e.g. Array at $(200, 300)$, Tree root at $(500, 150)$) and deterministic layout math rather than random coordinates. |
| **WiFi failure at venue** | Critical | Everything runs 100% offline via pre-compiled Golden Demos; local models or cached responses ready. |
