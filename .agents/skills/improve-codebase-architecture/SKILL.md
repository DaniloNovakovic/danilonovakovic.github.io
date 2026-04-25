---
name: improve-codebase-architecture
description: Find deepening opportunities in this codebase. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make the repo more testable and AI-navigable.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [LANGUAGE.md](LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [LANGUAGE.md](LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**
- **Dependency category drives testing approach**: classify dependencies using [DEEPENING.md](DEEPENING.md) before proposing seam strategy.

This skill is informed by the repository's existing architecture docs. In this project, use `AGENTS.md`, `.cursor/rules/`, `docs/ARCHITECTURE_RUNTIME.md`, `docs/ARCHITECTURE_CONSTITUTION.md`, and `docs/patterns/` as the source of language and constraints.

## Process

### 1. Explore

Read existing documentation first:

- `AGENTS.md`
- `.cursor/rules/`
- `docs/ARCHITECTURE_RUNTIME.md`
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/patterns/README.md`

Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates

Present a numbered list of deepening opportunities. For each candidate:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and also in how tests would improve

**Use this repo's vocabulary and [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture.** Talk about the bridge, kernel, SceneManager, context plugins, runtime modes, ECS systems, and React overlays using the names already present in `AGENTS.md` and `docs/`.

**Document conflicts**: if a candidate contradicts existing project guidance, only surface it when the friction is real enough to warrant revisiting that guidance. Mark it clearly and explain why the trade-off may be worth reopening.

Do NOT propose interfaces yet. Ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen only when useful:

- **Sharpening a fuzzy architectural term?** Prefer updating existing docs rather than creating a new documentation system.
- **User rejects the candidate with a load-bearing reason?** Offer to record it in the most relevant existing architecture doc only if future agents are likely to repeat the same suggestion.
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).