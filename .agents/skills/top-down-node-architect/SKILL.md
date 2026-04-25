---
name: top-down-node-architect
description: Manual opt-in skill for top-down decomposition. Use only when the user explicitly asks for a top-down approach, wishful thinking, stubs-first TypeScript flow, abstraction trees, or stepwise approval before leaf implementation.
---

# Top-Down Node Architect

Philosophy: Programming by wishful thinking and microscopic incrementalism.

## Prime Directive

Never mix orchestration (the "what") with implementation (the "how") in the same function.

- **Orchestration Nodes**: high-level functions that call other functions and express domain intent.
- **Leaf Nodes**: low-level functions that do concrete work (API calls, math, framework/library specifics, transformations).

## Invocation Triggers

Use this skill only when the user explicitly:

- asks for top-down decomposition
- requests "wishful thinking" or "stubs first"
- wants abstraction-first TypeScript design
- wants approval before low-level implementation

Do not infer this skill from ordinary complex work. The repository's normal default remains direct, YAGNI-first implementation through the existing architecture.

## Workflow

Copy this checklist and keep it updated in-progress:

```md
Top-Down Progress
- [ ] Step 1: Define wishful root
- [ ] Step 2: Declare stubs + types
- [ ] Step 3: Recursively decompose
- [ ] Step 4: Present abstraction tree
- [ ] Step 5: Wait for approval
- [ ] Step 6: Implement leaf nodes only
- [ ] Step 7: Validate abstraction purity
```

### Step 1: Wishful Root

Write the entry point as orchestration-only code using invented domain-first function names.

- Use intent names: `validateTransaction`, `buildSceneTransitionPlan`
- Avoid technical names: `checkIfInputIsNumber`, `loopItemsAndFilter`

### Step 2: Node Declaration (Stubbing)

For every invented function, immediately create a TypeScript stub.

- Define input/output types first.
- Keep body empty, `throw new Error("TODO")`, or minimal mock return.
- Do not implement real logic yet.

### Step 3: Recursive Decomposition

Treat each stub as a new root and repeat Steps 1 and 2 until each unresolved node is a true leaf.

Stop decomposition when the task is a direct primitive/standard-library/library call.

### Step 4: Abstraction Tree Review Gate

Before implementing any leaf logic, present:

1. Root function
2. Tree of nodes (orchestration vs leaf classification)
3. Type contracts at each edge
4. Open decisions/assumptions

Then explicitly wait for approval.

### Step 5: Leaf Implementation

After approval, implement leaf nodes one by one.

- Keep orchestration nodes orchestration-only.
- If low-level logic appears in an orchestration node, extract a new leaf.
- After each leaf, run tests/lints relevant to changed behavior.

## Implementation Rules

- **Single level of abstraction**: avoid mixing flow-level orchestration with low-level details.
- **Types first**: define interfaces/types before logic.
- **No early implementation**: no heavy async/effects/data transforms in orchestration nodes.
- **Table of contents rule**: top-level flow should be readable without opening leaves.

## Output Contract

When using this skill, structure responses in this order:

1. **Abstraction Tree** (root + child nodes)
2. **Type Contracts** (input/output for each node)
3. **Approval Request**
4. **Leaf Implementation Plan** (only after approval)

## Guardrails

- Prefer direct solutions over speculative architecture if the task is simple.
- Do not create extra indirection unless it improves clarity of orchestration vs implementation.
- Follow existing project architecture boundaries (store/kernel/scene/plugin/context patterns, etc.) rather than introducing parallel systems.

