# Architect Design for Deslopifying AI-Assisted Code

## What the research says about AI slop

“AI slop” in software is not just ugly code. The empirical literature now describes it as low-quality AI-generated artifacts that create review friction, degrade maintainability, and externalize cleanup costs onto reviewers and future maintainers. Baltes, Cheong, and Treude identify superficial competence and asymmetry of effort as central properties: the code often looks acceptable at first glance, while the real cost shows up later in review, debugging, and extension work.

The deeper problem is iterative erosion. SlopCodeBench measured what happens when agents repeatedly extend their own prior solutions under evolving requirements. Across trajectories, verbosity increased in 89.8% of cases and structural erosion increased in 80%; agent-produced code was 2.2 times more verbose than maintained human repositories, and prompt interventions improved initial quality without preventing later decline. That result matters for your Architect design because it means “give the agent a better prompt” is not a sufficient control. A long-horizon workflow needs explicit architecture governance.

Two more 2026 findings matter directly. CodeTaste found that coding agents do better when refactorings are specified in detail, and that a propose-then-implement decomposition improves alignment with human refactoring choices. FixedBench found the opposite but equally dangerous failure mode: agents frequently make unnecessary changes when the correct action is to do nothing, with undesirable edits still appearing in 35% to 65% of cases unless abstention is framed as a successful outcome. An anti-slop Architect therefore needs both a proposal phase and an explicit no-change phase.

That framing also lines up with architecture practice outside AI tooling. Fowler’s evolutionary-architecture work argues for small changes and feedback loops, while fitness functions are the mechanism for checking whether implementation is staying close to design intent. In AI-assisted workflows, that translates into two layers: a planning/review layer that reasons about architecture, and an automated enforcement layer that keeps drift visible early.

## What your current Architect already gets right

Your current description is already strong in the right places. It treats certain files as protected shared seams and assigns the Architect ownership of seam sequencing, dependency order, branch strategy, and “what cannot be parallelized.” That is much closer to the real failure mode than a generic “clean code reviewer.” Fowler’s branching material is explicit that the dangerous conflicts are often semantic, not textual: branches can merge cleanly and still break runtime behavior. High-fan-out coordination points such as registries, identifiers, stores, and runtime-context assembly are exactly the places where that kind of semantic conflict happens. The last part is an inference from the filenames you listed, not a repository audit, but it is the right inference to start from.

Your description also matches Matt Pocock’s real skill philosophy more closely than most “AI architect” prompts do. His `improve-codebase-architecture` skill is explicitly about deepening opportunities, using depth, leverage, locality, a deletion test, and the rule that one adapter is only a hypothetical seam while two adapters make a seam real. His `zoom-out` skill exists to map unfamiliar modules before making a call. His setup flow assumes `CONTEXT.md` and ADRs exist for domain language and historical decisions. His `to-issues` skill splits work into AFK and HITL tracer-bullet slices instead of vague multi-week branches. That is not “vibe coding.” It is a control system for sequencing and architecture.

The Gemini memo you attached lands on the same center of gravity: deep modules, seams, AI navigability, and governance over speed. That part is directionally correct. The part I would narrow is scope. The core problem here is not generic game-engine purity. It is repository-specific seam governance around registries, IDs, shared runtime, and branch sequencing.

## What the current design is still missing

The first missing piece is an explicit abstention path. Your current Architect sounds like a planner that always does something. The research says that is dangerous. Present-day coding agents have an action bias, and that bias itself accumulates debt. Your Architect must be allowed to return **NO-CHANGE** as a first-class success state when the issue is already solved, the refactor is not justified, or the proposed abstraction would be shallower than the current code. Without that, the agent will “help” by manufacturing architecture.

The second missing piece is a formal proposal contract before implementation. CodeTaste shows that propose-then-implement works better than asking the agent to jump straight into the refactor. Pocock’s architecture skill says the same thing in practice: first explore, then present deepening candidates, then grill the choice, and only then get specific about the interface. Rahul Garg’s design-first workflow reaches the same conclusion from another angle: once contracts are agreed, tests can be generated before implementation. Your current Architect description does not force that gate.

The third missing piece is durable decision state. `CONTEXT.md` and ADRs are not optional documentation in an AI-heavy workflow; they are external memory. Fowler’s context-anchoring work makes the point plainly: code shows outcomes, not reasoning, and the “why” behind a design is what long sessions, compaction, and fresh agents lose first. ADRs exist because the reasoning behind code is fragile and valuable. Your current description protects paths, but it does not specify where rationale, rejected alternatives, and open questions are recorded.

The fourth missing piece is deterministic enforcement. Anthropic’s hook system exists precisely because relying on the model to remember every rule is weak. Hooks provide deterministic control before and after tool use; prompt-based and agent-based hooks exist for judgment, but Anthropic’s guidance is to prefer command hooks for production workflows. Fitness functions play the same role at the architecture level: they shift governance left so the system catches drift before a reviewer has to discover it by hand. If your Architect only advises and nothing blocks protected-seam edits, the role will erode into a polite suggestion generator.

The fifth missing piece is a clean responsibility boundary between writer and judge. Qodo’s governance argument is blunt: the system that generates code should not grade its own homework. Anthropic’s own example subagent for code review is read-only by design. That is the correct shape for an anti-slop reviewer: it should inspect diffs, modified files, tests, and runtime risks without sharing the writer’s incentives to “finish the patch.”

## The operating model that will actually hold up

Do not solve this with a single all-purpose Architect prompt. Use a three-layer stack.

The first layer is a **main-thread `/architect` skill** that runs before implementation. This is where you keep the high-context sequencing logic and Matt-style workflows, because skills are reusable procedures that load only when needed, which keeps long reference material cheap until invoked. This layer should run `zoom-out` when the module is unfamiliar, run an architecture review when the change proposes new seams or wrappers, and only then classify the work.

The second layer is a **read-only `architect-reviewer` subagent** that runs after AI-generated changes or before protected-seam edits. Subagents are the right place for isolated, focused review because they run with their own context window, system prompt, and tool permissions. Anthropic’s guidance for subagents is clear: keep them focused, use detailed descriptions, and limit tool access for security and focus.

The third layer is **deterministic hooks plus CI fitness checks**. Hooks are for the non-negotiables: blocking writes to protected files unless an architecture note exists, forcing post-write checks, and rejecting outputs that fail the required review schema. Fitness functions are for the repository-specific invariants: registry completeness, ownership boundaries, import direction, and runtime assembly rules. This is the layer that turns “good taste” into executable governance.

The planning skill should always emit one of four classifications:

- **NO-CHANGE** — no code change should be made.
- **SAFE-AFK** — one thin vertical slice can be implemented and merged safely.
- **SAFE-WITH-SEQUENCE** — parallel work is possible, but only if blockers land in a specified order.
- **HITL** — human review, ADR update, or design approval is required before coding.

That classification is the right bridge between several sources: FixedBench’s abstention requirement, Pocock’s AFK/HITL issue slicing, and trunk-based guidance that favors short-lived, narrow branches over long-lived divergence. SAFE-AFK should map to one short-lived branch and one thin vertical slice. SAFE-WITH-SEQUENCE should include an explicit blocker ordering. HITL should stop branch proliferation before shared seams fork into semantic-conflict mountains.

Inside that workflow, use Pocock’s anti-slop tests as hard review heuristics. Apply the deletion test to every proposed module or wrapper. Reject new interfaces whose surface area grows as fast as their implementation. Treat one adapter as insufficient evidence for abstraction. Prefer locality: keep change, bugs, and knowledge concentrated in one place instead of scattering behavior into “clean-looking” pass-through files. Treat the interface as the test surface. Those rules are much more concrete than “avoid slop,” and they are close to what his architecture skill already encodes.

Pair that with a lightweight context artifact. Use project-level `CONTEXT.md` for stable vocabulary and rules. Use `docs/adr/` for real decisions. Use a per-feature note for active design state: what was chosen, what was rejected, what remains open, and what sequence the work must follow. Fowler’s context-anchoring argument is that this kind of feature doc is effectively a living ADR during active work. That is the right place to store “why this seam must stay single-owner” or “why we rejected a registry abstraction.”

## Concrete implementation for Claude Code

The strongest implementation is repository-local, not generic. Anthropic’s docs say project subagents in `.claude/agents/` are the right place for codebase-specific workers and should be checked into version control so the team can share and improve them. They also say automatic delegation depends heavily on the `description` field, and that phrases like “use proactively” encourage delegation. Keep this one read-only by default. Do **not** rely on plugin subagents for the real enforcement version of this role, because plugin subagents ignore `hooks` and `permissionMode`. Also avoid subagent memory here: when memory is enabled, Anthropic automatically enables Read, Write, and Edit so the subagent can maintain its own memory files, which is the opposite of what you want for a strict architecture reviewer.

A good repository-local reviewer subagent looks like this:

```md
---
name: architect-reviewer
description: Architecture gatekeeper for seam safety, sequencing, and anti-slop review. Use proactively before editing protected seams, before parallelizing work, and immediately after AI-generated patches that touch registries, IDs, runtime assembly, or ownership boundaries.
tools: Read, Grep, Glob, Bash
permissionMode: plan
model: inherit
maxTurns: 8
---

You are a read-only architecture reviewer. You do not write production code.

Your job is to prevent merge-conflict mountains, architecture drift, and AI slop.

Treat these as protected shared seams and high-risk semantic-conflict surfaces:
- src/game/bridge/store.ts
- src/game/scenes/sceneIds.ts
- src/game/scenes/sceneRegistry.ts
- src/game/overlays/overlayIds.ts
- src/game/overlays/overlayRegistry.ts
- src/game/sceneLifecycle/contexts/createSceneContexts.ts
- src/game/sharedSceneRuntime/**

Decision protocol:
1. Start from the smallest safe change.
2. Classify the task as exactly one of:
   - NO-CHANGE
   - SAFE-AFK
   - SAFE-WITH-SEQUENCE
   - HITL
3. If protected seams are touched, say whether the work is serial, partially parallel, or forbidden without design approval.
4. If the issue is already fixed, the refactor is unjustified, or the proposed abstraction is shallow, return NO-CHANGE and stop.

Anti-slop tests:
- Apply the deletion test to every new module or wrapper.
- Reject shallow indirection and pass-through abstractions.
- Prefer locality over extracted “clean” fragments that move bugs into call sites.
- Treat the interface as the test surface.
- Do not add an interface for a seam that has only one adapter.
- Default to preserving existing ownership boundaries unless there is explicit leverage from changing them.

Required output:
## Classification
## Protected seams touched
## Shared seams touched
## Parallelization decision
## Required sequence
## Slop risks
## Required docs
## Recommended next step

Rules for the output:
- Be specific.
- Name the exact files touched.
- If SAFE-WITH-SEQUENCE, list the blocker order.
- If HITL, state what human decision is missing.
- If NO-CHANGE, explain why in one paragraph.
```

Keep Matt Pocock’s architecture skills in the **parent** `/architect` workflow rather than burying them inside this reviewer. His `improve-codebase-architecture` skill explicitly expects an exploratory phase and a candidate-selection/grilling conversation; that is best used from the main planning flow, not jammed into a narrow post-change reviewer. My inference is that the cleanest composition is: parent skill orchestrates `zoom-out` and architecture review, then the read-only reviewer subagent checks the actual diff against those decisions.

Back that subagent with command hooks. Anthropic’s hook system supports `PreToolUse` and `PostToolUse` for `Edit` and `Write`, can filter by tool name and arguments, and is explicitly meant to enforce project rules. Use command hooks for protection in production. Use prompt hooks only for softer “output shape” checks.

A minimal hook skeleton is enough:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/protect-shared-seams.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/run-architecture-fitness.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Block completion unless the response contains: Classification, Protected seams touched, Parallelization decision, Required sequence, Slop risks, and Required docs."
          }
        ]
      }
    ]
  }
}
```

For your repository, the fitness layer should be repo-specific. Based on the filenames you marked as protected, I would encode at least these invariants:

- **Registry integrity checks** so `sceneIds.ts` and `sceneRegistry.ts`, and `overlayIds.ts` and `overlayRegistry.ts`, cannot drift apart.
- **Single-owner context assembly checks** so `createSceneContexts.ts` remains the controlled construction point for scene lifecycle context rather than having ad hoc assembly proliferate elsewhere.
- **Import-direction checks** so code inside `src/game/sharedSceneRuntime/**` does not accrete scene-specific or overlay-specific dependencies that collapse the seam.
- **Protected-seam gate checks** so edits to any protected path require an architecture note, a SAFE-WITH-SEQUENCE/HITL classification, or a dedicated approval token from the parent workflow.

Those checks are not guesses about best practice in the abstract. They are the concrete “fitness functions” version of the seam-protection intent already present in your current Architect description.

## Rewritten Architect spec

The version below is the one I would actually use in the repo. It keeps your original seam-protection intent, but it adds the missing properties the research says you need: abstention, proposal-before-implementation, durable context, and enforceable review boundaries.

```md
ArchitectPurpose: prevent merge-conflict mountains, architecture drift, and AI slop.

The Architect is a planning and review role, not a default implementation role.
It exists to decide:
- whether the correct action is NO-CHANGE
- whether work is SAFE-AFK
- whether work is SAFE-WITH-SEQUENCE
- whether work is HITL and must stop for human design review

The Architect uses:
- `.agents/skills/zoom-out/SKILL.md` to map unfamiliar modules and callers before making sequencing calls
- `.agents/skills/improve-codebase-architecture/SKILL.md` to find deepening opportunities, apply the deletion test, and evaluate locality/leverage before approving abstractions
- `.agents/skills/to-issues/SKILL.md` to break approved work into AFK or HITL tracer-bullet slices

The Architect owns:
- shared seam sequencing
- branch strategy
- ownership boundaries
- dependency order
- deciding what cannot be parallelized
- deciding what should not be changed at all

The Architect must protect:
- src/game/bridge/store.ts
- src/game/scenes/sceneIds.ts
- src/game/scenes/sceneRegistry.ts
- src/game/overlays/overlayIds.ts
- src/game/overlays/overlayRegistry.ts
- src/game/sceneLifecycle/contexts/createSceneContexts.ts
- src/game/sharedSceneRuntime/**

The Architect must apply these anti-slop rules:
- Prefer deep modules over shallow wrappers.
- Apply the deletion test to every proposed module.
- Treat one adapter as a hypothetical seam and two adapters as a real seam.
- Prefer locality: keep change, bugs, and knowledge concentrated.
- Treat the interface as the test surface.
- Reject abstractions that add interface complexity without leverage.
- Treat NO-CHANGE as a valid successful outcome.

Required output from the Architect:
- Classification: NO-CHANGE | SAFE-AFK | SAFE-WITH-SEQUENCE | HITL
- Protected seams touched
- Shared seams touched
- Parallelization decision
- Required sequence
- Slop risks
- Required docs or ADR updates
- Smallest safe next step

Default question for the Architect:
What is the smallest safe change? Does it touch shared seams? If yes, what must serialize, what can remain parallel, and what should not be changed at all?
```

The difference between an Architect that “sounds senior” and one that actually deslopifies is enforcement. The evidence now says prompt-only quality control degrades under repeated iteration, refactoring works better when proposal precedes implementation, and agents need explicit permission to abstain when no code change is warranted. Your current role is already close to the right seam-oriented model; the fix is to add output contracts, a no-op success path, durable architectural memory, and deterministic hooks that make drift expensive instead of merely undesirable.
