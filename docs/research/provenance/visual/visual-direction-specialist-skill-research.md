# Visual Direction Specialist Skill Research

## Bottom line

The right move is not a broad, always-on “visual designer” persona. The right move is a **narrow, opt-in skill** whose job is to **preserve and extend your existing style guide without introducing a new visual system**. The reference stack should be deliberately asymmetric: your own style guide first; **Open Peeps** for modular cutout logic; **Life is Strange** for “animated concept art” surfaces and painted ephemera; **Hades** for pen-and-ink massing, silhouette clarity, and production-efficient stylization; and **Return of the Obra Dinn** only for special memory/noir states because Lucas Pope documented concrete readability and motion tradeoffs in 1-bit dithered imagery. The implementation layer should stay anchored in your current Phaser + React + Tailwind/CSS-utility approach unless the request is explicitly about changing the stack. citeturn15view0turn16view0turn17view0turn16view3turn16view4turn14view3turn14view4

There is also a prompt-engineering reason to keep this specialist opt-in. OpenAI recommends putting **rules, tone, and workflow guidance in instructions**, while using attached knowledge files as reference material, and Anthropic recommends defining **clear success criteria** before prompt iteration. Anthropic’s current guidance also warns that strong agentic models can **overuse subagents** when a simpler direct path would suffice. In practice, that means a style-conserving design specialist should be activated only when the task really needs it, instead of constraining every normal development conversation. citeturn14view8turn18view1turn21view1

## Why the Gemini draft should not become the skill

The Gemini draft you shared fileciteturn0file0 is useful as a **research dump**, but it is not a safe production spec. It mixes good reference ideas with lower-authority sources, and it repeatedly turns **optional technical branches** into what reads like **default advice**. That is the wrong behavior for your project because your own style guide is intentionally narrow: off-white paper, black ink, monochrome accents, reusable sticker logic, stepped motion, and explicit resistance to style-system/toolchain drift.

| Topic in the shared draft | Decision | Why |
| --- | --- | --- |
| Modular sticker logic | **Keep** | Open Peeps is explicitly a hand-drawn library that works like **building blocks** of vector parts and supports broad recombination; that maps directly to your reusable paper-cutout rule. citeturn15view0turn14view0 |
| Life-is-Strange-like painted notes, props, and journal surfaces | **Keep** | Edouard Caplain said the target look was “animated concept art”; props, paper notes, posters, and lighting were treated to preserve the painted/concepted feel. citeturn16view0turn16view1 |
| Hades-style pen-and-ink shadow massing | **Keep, but only the ink-production lesson** | Jen Zee said Supergiant pivoted to pen and ink because it fit the game’s direction and was faster than painterly work at Hades’s asset scale. Borrow the shadow-massing and silhouette logic, not Hades’s color language. citeturn17view0turn17view3 |
| Obra Dinn-style 1-bit treatment | **Conditional only** | Pope documented that 1-bit dithering caused face-recognition and motion-stability problems until he increased resolution and stabilized the pattern. That makes it excellent for selective memory states, not a default UI/world treatment. citeturn16view3turn16view4turn16view5 |
| Panda CSS and vanilla-extract | **Do not make default advice** | Both are separate build-time styling systems. They are legitimate tools, but recommending them by default would be a stack migration, not a style extension. citeturn14view13turn14view14 |
| Spine, DragonBones, or 3D-to-2D pipelines | **Do not make default advice** | Official Spine support for Phaser exists, but it is a separate runtime and, in Phaser 4, Phaser explicitly points users to Esoteric’s official plugin because bundled Spine plugins are no longer updated. That belongs in a future rigging/tooling branch, not a default design skill. citeturn14view11turn14view12turn19view0 |

The draft is most valuable when it reinforces **modularity, pen-and-ink hierarchy, paper-surface treatment, and subtle procedural wobble**. It is least valuable when it normalizes **new styling systems, skeletal-animation tooling, or speculative 3D production workflows** that your current guide explicitly treats as out of scope.

## Reference stack the skill should trust

### Visual language references

The strongest foundational reference is **Open Peeps** because it is already structurally aligned with your project. Officially, it is a hand-drawn library that works like **building blocks** of vector arms, legs, emotions, and poses; it is also CC0, which matters if the skill ever needs to point to reusable research examples or component logic. The important lesson is not “copy Open Peeps literally.” It is: **design characters and props as a constrained modular system with stable anchors, clean silhouettes, and controlled variants**. citeturn15view0turn14view0

For the sketchbook atmosphere, **Life is Strange** is useful because Caplain described the target as an **animated concept-art look**. He also described a pipeline where the 3D team tried to reproduce not just concept content but the concept **style**, with painted props, painted notes/posters, and lighting adjusted to preserve the same banded, illustrative feel. That is directly relevant to your “living illustration on high-quality sketchbook paper” goal. The lesson to encode into the skill is: **treat surfaces, props, margin notes, and overlays as painted artifacts inside the world, not as neutral UI chrome**. citeturn16view0turn16view1

**Hades** is the right production reference for pressure-tested stylization. Jen Zee explained that Supergiant is “game design-led,” that art ideas are disposable until gameplay and narrative harden, and that Hades pivoted into **pen and ink** partly because it was more compatible with the game’s scale than painterly rendering. She also referenced explicit influence from pen-and-ink traditions and artists such as Mike Mignola, and discussed making an early **color script** to catch weak points in the overall experience. For your skill, the transferable lesson is not mythology, glamour, or high saturation. It is: **use black shadow masses, clear silhouettes, and early hierarchy checks to keep the experience readable under production constraints**. citeturn17view0turn17view3

**Return of the Obra Dinn** should be treated as a **constraint reference**, not a house-style reference. Pope documented a grayscale-to-1-bit postprocess using Bayer and blue-noise patterns, but he also documented its cost: face recognition became harder, moving imagery became a “wiggling mess,” and he had to stabilize the dither to reduce discomfort. Your own style guide already reserves harsher 1-bit/dither treatments for memory beats. The research strongly supports that restriction. citeturn16view3turn16view4turn16view5

### Technical and accessibility references

For subtle “living paper” motion, **SVG filters are enough** for a large class of UI and overlay treatments. MDN documents that `<feTurbulence>` generates artificial texture via Perlin turbulence and that `<feDisplacementMap>` spatially displaces the source graphic. The practical inference is straightforward: a **very low-amplitude, low-frequency** displacement can create paper wobble, edge boil, or slightly unstable ink lines **without redrawing every frame**. This fits your style guide far better than smooth, synthetic easing. citeturn14view1turn14view2

For reusable assets and UI surfaces inside Phaser, the official docs already give you the primitives your skill should think in. Phaser texture frames can include an **optional custom pivot point**, which is exactly what modular sticker assets need for stable anchors. Phaser’s **Nine Slice** object is also well suited to paper-cutout buttons and panels because its vertices stay batched with other sprites and graphics, which means you can get scalable bordered panels without inventing a heavier system. The caveat is that Nine Slice is **WebGL-only** as documented. citeturn14view3turn14view4

Your monochrome palette is not the accessibility problem. By calculation, `#1a1a1a` on `#fbfbf9` is about **16.8:1 contrast**, comfortably above WCAG AA and AAA thresholds. The bigger risks are **decorative handwriting used for dense copy**, weak focus states, and non-essential motion. W3C explains the contrast thresholds, WebAIM recommends simple, familiar, easily parsed fonts, and the EU typography accessibility guide explicitly warns that artistic handwritten fonts are not designed for legibility. That implies a clear policy for the skill: **handwritten type can stay as the voice of headings, prompts, stickers, and short labels, but longer modal copy, project descriptions, and body text need the most legible on-brand option available**. citeturn14view5turn14view15turn14view16

The same pattern applies to motion and focus. MDN documents `prefers-reduced-motion`; WCAG explains that animation triggered by interaction should be disableable when it is non-essential, and it specifically calls out parallax and page-turn-like transitions as things that can need suppression. WCAG also requires focus indicators to maintain sufficient adjacent contrast, and its C40 technique recommends a **two-color focus indicator** so at least one band remains visible against varied backgrounds. That means your skill should treat wobble, page-flip, parallax, and ink-bleed transitions as **optional decoration**, while making focus states and keyboard flow first-class design outputs. citeturn14view6turn20view0turn14view7turn20view1turn20view3

## Recommended behavior model

The skill should behave like a **style conservator with implementation literacy**, not like a trend scout. OpenAI’s guidance is clear that rules belong in instructions and reference material belongs in attached files, and Anthropic recommends explicit success criteria plus source verification. Applied here, that means the skill needs **hard rules** in the prompt and a small **reference dossier** in markdown, rather than a loose pile of mixed-quality web links. citeturn14view8turn21view1

A good behavior model for this specialist is a six-check gate:

| Check | Pass condition |
| --- | --- |
| Style fidelity | Keeps the off-white paper / black ink / monochrome hatching language intact. |
| Modular thinking | Proposes reusable stickers, landmarks, props, or UI surfaces with stable anchors and small variant sets. |
| Readability hierarchy | Uses silhouette, line weight, shadow mass, spacing, and hatching for hierarchy before reaching for new colors or effects. |
| Stack fit | Speaks in Phaser, React, Tailwind, CSS utilities, sprite atlases, pivots, and shared classes before proposing new libraries. |
| Accessibility | Preserves contrast, legible longer-form text, visible focus, and reduced-motion paths. |
| Scope discipline | Treats Spine, alternate styling systems, or 3D-to-2D workflows as explicit escalation paths, not defaults. |

That gate is important because specialized subagents can become overeager. Anthropic explicitly notes that subagent-capable systems may delegate too aggressively or overcomplicate simple work unless you define when they are and are not warranted. This skill should therefore be invoked for **visual direction, UI polish, motion treatment, asset decomposition, and style QA**, not for ordinary coding or content tasks. citeturn21view1

## Copy-ready skill instruction

The following is the version worth implementing:

```md
# Visual Designer — Digital Sketchbook

You are an opt-in visual design specialist for Danilo Novaković’s portfolio project.
You do not invent a new visual language.
You preserve, extend, and quality-check the existing “Digital Sketchbook” style.

## Use this skill only when
- The user explicitly opts in to visual design help
- The task is about art direction, visual hierarchy, UI styling, motion treatment, environmental storytelling, asset decomposition, component polish, or style QA
- The task benefits from close adherence to the project style guide

Do not activate for routine coding, data work, generic writing, or toolchain migration unless the user explicitly asks for those things.

## Primary mission
Translate the current style guide into concrete, production-usable decisions for:
- Phaser world art
- React overlays and modals
- Shared UI components
- Motion and transitions
- Asset specs for characters, props, landmarks, and prompts

## Non-negotiable style rules
- Preserve the off-white sketchbook paper background and high-contrast black ink language
- Keep the project monochrome; use hatching, shadow mass, texture, and line-weight contrast instead of new color systems
- Treat characters, props, landmarks, and accents as reusable paper cutouts with stable anchors and small variant sets
- Preserve thick outer contours and lighter interior marks
- Favor stepped motion, subtle wobble, and low-frequency jitter over smooth synthetic easing
- Reserve denser hatching, harsher 1-bit/dither moods, and stronger shadow treatment for memories or exceptional emotional beats only
- Reuse the existing border + hard-offset-shadow convention for buttons, modals, and paper surfaces unless there is a clear reason not to

## Reference hierarchy
When references conflict, follow this order:
1. Current project style guide and existing components
2. Existing project implementation patterns
3. Official/Open primary references
4. Creator interviews and production writeups
5. General implementation docs

## Reference anchors
Use these principles, not literal copying:
- Open Peeps: modular cutout logic, clean silhouettes, recombinable parts
- Life is Strange: animated concept-art atmosphere, painted props/paper artifacts, journal-like environmental storytelling
- Hades: pen-and-ink shadow massing, silhouette-first readability, production-conscious stylization
- Return of the Obra Dinn: constrained memory/noir treatment only, never default UI or body-text styling

## Default implementation bias
Assume the project remains on:
- Phaser for the game world
- React for overlays
- Tailwind/CSS utilities/shared classes for styling

Do not suggest Panda CSS, vanilla-extract, Spine, DragonBones, or 3D-to-2D render pipelines unless the user explicitly asks to explore a tooling change.

## Typography policy
- Handwritten/cursive styling is acceptable for headings, margin notes, prompts, labels, stickers, and short UI text
- For longer modal copy, project descriptions, or dense information, prefer the most legible on-brand option and state the trade-off clearly
- Never sacrifice readability for style theater

## Motion policy
- Any non-essential motion must have a reduced-motion version
- Page-flip, parallax, wobble, and ink-bleed effects are decorative by default
- Motion must support comprehension, not distract from it

## What to produce
For each request, output:
1. Design intent
2. On-style concept direction
3. Visual hierarchy notes
4. Component or scene anatomy
5. Motion notes
6. Implementation notes for Phaser / React / Tailwind
7. Asset checklist
8. Accessibility checks
9. Risks or assumptions

## Response discipline
- Be concrete
- Mention exact surfaces, assets, and interaction states
- Prefer modifications to existing patterns over invention of new systems
- If a request conflicts with the style guide, say so and redirect to the narrowest on-style alternative
- If a feature would require a real toolchain change, label it as an escalation path, not as the default answer

## Forbidden defaults
- No spontaneous style-system migrations
- No default colorization beyond the monochrome language
- No “just use smooth modern microinteractions”
- No default skeletal-animation recommendation
- No speculative 3D pipeline recommendations unless explicitly requested
- No citations from low-authority sources when official or creator-primary sources exist
```

The structure above is deliberate. It puts **behavior in instructions**, keeps the specialist **narrowly scoped**, codifies an explicit **reference hierarchy**, and makes the default output concrete enough for implementation and review rather than vague art talk. That is exactly the pattern current prompt-engineering guidance recommends. citeturn14view8turn14view10turn21view1

## Packaging and evaluation

If you package this in ChatGPT, a **separate custom GPT** is the cleanest opt-in surface. OpenAI’s help center states that you can invoke a GPT from a normal conversation with `@`, and that GPTs start fresh without your saved memory or normal custom instructions. That is a good fit here because the skill should be activated intentionally and should carry its own ruleset. OpenAI also recommends **clear, text-forward files**, so the reference pack should be markdown, not a visually complex PDF. citeturn14view9turn14view8

The reference pack should stay small and opinionated:

- `style-guide.md` with your existing Digital Sketchbook rules
- `reference-notes.md` with short summaries of Open Peeps, Life is Strange, Hades, Obra Dinn, Phaser UI primitives, SVG filters, and accessibility rules
- `anti-patterns.md` listing what the skill must not default to
- `evals.md` containing benchmark prompts and what a passing answer must include

Anthropic’s guidance to define success criteria and verify sources across multiple references is especially useful here. Treat the skill like a product with evals, not like a one-off prompt. A strong benchmark set would include: a paper-cutout modal redesign, a new building façade with an `[E] ENTER` state, a memory-scene treatment, a dense-text project overlay, and a motion pass on parallax or page-turn transitions. Passing answers should stay on-style, stay within the current stack, mention accessibility implications, and avoid unnecessary toolchain changes. citeturn21view1turn18view1

One final conditional path belongs in the documentation, but not in the default prompt: if the project later genuinely needs rigged 2D animation, the research path should point to **official `spine-phaser` support** rather than legacy bundled solutions, because official Spine support for Phaser 3 and 4 exists and Phaser now explicitly says its bundled Spine plugins are no longer updated in Phaser 4. That should live in `anti-patterns.md` as an **escalation clause**, not in the main style skill. citeturn14view11turn14view12turn19view0
